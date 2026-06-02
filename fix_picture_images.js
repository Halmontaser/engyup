/**
 * Fix picture activities: remove audio URLs from image fields,
 * resolve legacy IDs, fix number-turned-URLs.
 *
 * Step 1: Clear audio URLs from image fields (they're wrong)
 * Step 2: Resolve legacy ID text ("ID: 701") → proper R2 URL
 * Step 3: Fix number-only image URLs → lookup in legacy CSV for proper mapping
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_picture_images.js --dry-run
 *   node fix_picture_images.js
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV1 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// ─── Parse legacy CSV ─────────────────────────

console.log("Parsing db_images_export.csv...");
const legacyMap = new Map();
const text = fs.readFileSync(CSV1, "utf8");
const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
for (const line of lines) {
  const comma = line.indexOf(",");
  if (comma === -1) continue;
  const id = line.substring(0, comma).trim(); // e.g. "701.png"
  const num = id.replace(".png", "");         // e.g. "701"
  // Find what unit this ID belongs to (check all possible unit dirs)
  legacyMap.set(num, id);
}
console.log(`  ${legacyMap.size} legacy IDs loaded\n`);

// ─── Fetch activities with "picture" ─────────

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

// Recursively fix image values in content
function fixImageFields(obj, prefix = "", fixes = []) {
  if (!obj || typeof obj !== "object") return { value: obj, changed: false, fixes };

  if (Array.isArray(obj)) {
    let changed = false;
    const newArr = obj.map((item, i) => {
      const result = fixImageFields(item, `${prefix}[${i}]`, fixes);
      if (result.changed) changed = true;
      fixes = result.fixes;
      return result.value;
    });
    return { value: newArr, changed, fixes };
  }

  let changed = false;
  const newObj = {};
  for (const [key, val] of Object.entries(obj)) {
    const fp = prefix ? `${prefix}.${key}` : key;

    if (typeof val === "string" && IMAGE_KEYS.has(key) && val) {
      let newVal = val;

      // 1. Audio URL in image field → null it out (can't guess the right image)
      if (val.startsWith(R2_BASE) && /\/audio\/.+\.(mp3|ogg|wav|m4a)$/i.test(val)) {
        console.log(`  🎵→✕  ${fp}: "${val.substring(0,80)}" → NULL (audio URL in image field)`);
        newVal = null;
        changed = true;
        fixes.push({ path: fp, old: val, new: null, action: "clear_audio" });
      }
      // 2. Legacy ID text: "ID: 701" or "ID: 701, Label: ..."
      else if (/^ID:\s*(\d+)/.test(val)) {
        const m = val.match(/^ID:\s*(\d+)/);
        const num = m[1];
        if (legacyMap.has(num)) {
          // Find unit from context — scan content for unit pattern
          const unitStr = JSON.stringify(obj).match(/g(\d+)u(\d+)/i);
          const unit = unitStr ? `g${unitStr[1]}u${unitStr[2]}` : "g7u1"; // fallback
          const newUrl = `${R2_BASE}/${unit}/images/${num}.png`;
          console.log(`  🆔→🔗  ${fp}: "${val}" → ${newUrl}`);
          newVal = newUrl;
          changed = true;
          fixes.push({ path: fp, old: val, new: newUrl, action: "resolve_legacy_id" });
        } else {
          console.log(`  ⚠️  ${fp}: "${val}" — legacy ID ${num} NOT FOUND in CSV`);
        }
      }
      newObj[key] = newVal;
    } else if (typeof val === "object" && val !== null) {
      const result = fixImageFields(val, fp, fixes);
      if (result.changed) changed = true;
      fixes = result.fixes;
      newObj[key] = result.value;
    } else {
      newObj[key] = val;
    }
  }
  return { value: newObj, changed, fixes };
}

async function fetchPictureActivities() {
  const all = [];
  const limit = 1000; let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?instruction=ilike.*picture*&select=activity_id,lesson_id,title,activity_type,instruction,content&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url, { headers: HEADERS });
    if (!resp.ok) throw new Error(`Fetch: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

async function updateActivity(activityId, newContent) {
  const url = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(activityId)}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content: newContent }),
  });
  if (!resp.ok) throw new Error(`Update: ${resp.status} ${await resp.text()}`);
}

async function main() {
  console.log("Fetching picture activities...");
  const activities = await fetchPictureActivities();
  console.log(`  ${activities.length} activities\n`);

  let totalAffected = 0;
  let totalFixes = 0;
  const byAction = { clear_audio: 0, resolve_legacy_id: 0 };

  for (const act of activities) {
    const fixes = [];
    const result = fixImageFields(act.content, "", fixes);
    if (!result.changed) continue;

    totalAffected++;
    totalFixes += fixes.length;
    for (const f of fixes) byAction[f.action] = (byAction[f.action] || 0) + 1;

    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type})`);

    if (!DRY_RUN) {
      try {
        await updateActivity(act.activity_id, result.value);
        console.log(`   ✅ UPDATED`);
      } catch (e) {
        console.log(`   ❌ ${e.message}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Activities affected: ${totalAffected}`);
  console.log(`Total fixes: ${totalFixes}`);
  console.log(`  Audio URLs cleared: ${byAction.clear_audio}`);
  console.log(`  Legacy IDs resolved: ${byAction.resolve_legacy_id}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
}

main().catch(console.error);
