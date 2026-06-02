/**
 * Fix remaining image placeholder issues in picture activities:
 * 1. Numeric strings ("1329", "931") → resolve to R2 URLs via db_images_export.csv
 * 2. Descriptive text prompts → null out (they're not image paths)
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_placeholders.js --dry-run
 *   node fix_placeholders.js
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV1 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json", "Prefer": "return=representation",
};

// Parse legacy CSV
const legacyMap = new Map();
const csvText = fs.readFileSync(CSV1, "utf8");
for (const line of csvText.split(/\r?\n/).filter(Boolean).slice(1)) {
  const comma = line.indexOf(",");
  if (comma === -1) continue;
  const id = line.substring(0, comma).trim();
  const num = id.replace(/\.\w+$/, "");
  legacyMap.set(num, id);
}
console.log(`Loaded ${legacyMap.size} legacy IDs\n`);

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function deduceUnit(obj) {
  const str = JSON.stringify(obj);
  const m = str.match(/g(\d+)u(\d+)/i);
  return m ? `g${m[1]}u${m[2]}` : null;
}

function fixValues(obj, contentForUnit = null) {
  /** Returns: { value, changes: [{path, old, new, action}] } */
  const changes = [];

  function walk(o, prefix = "") {
    if (!o || typeof o !== "object") return o;

    if (Array.isArray(o)) {
      return o.map((item, i) => walk(item, `${prefix}[${i}]`));
    }

    const result = {};
    for (const [key, val] of Object.entries(o)) {
      const fp = prefix ? `${prefix}.${key}` : key;

      if (typeof val === "string" && IMAGE_KEYS.has(key) && val && !val.startsWith("http") && !val.startsWith("/media/")) {
        // 1. Pure numeric string: "1329", "931" → look up in legacy CSV, convert to R2 URL
        if (/^\d+$/.test(val.trim()) && legacyMap.has(val.trim())) {
          const unit = deduceUnit(o) || deduceUnit(contentForUnit) || "g7u1";
          const newUrl = `${R2_BASE}/${unit}/images/${val.trim()}.png`;
          changes.push({ path: fp, old: val, new: newUrl, action: "resolve_numeric" });
          result[key] = newUrl;
          continue;
        }

        // 2. Descriptive text (> 20 chars with spaces) — these are prompts, not paths
        if (val.length > 20 && val.includes(" ")) {
          changes.push({ path: fp, old: val, new: null, action: "clear_prompt_text" });
          result[key] = null;
          continue;
        }

        // 3. File-like names ending in common image extensions — leave for now
        if (/\.(png|jpg|jpeg|gif|webp)$/i.test(val)) {
          // e.g., "lost_girl.png", "red_swatch.png" — keep as-is, needs manual resolution
          result[key] = val;
          continue;
        }

        // 4. Everything else — keep
        result[key] = val;
      } else {
        result[key] = walk(val, fp);
      }
    }
    return result;
  }

  const newObj = walk(obj);
  return { value: newObj, changes };
}

async function fetchPictureActivities() {
  const all = [];
  const limit = 1000; let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?instruction=ilike.*picture*&select=activity_id,lesson_id,title,activity_type,content&limit=${limit}&offset=${offset}`;
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

async function updateActivity(id, newContent) {
  const url = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(id)}`;
  const resp = await fetch(url, {
    method: "PATCH", headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content: newContent }),
  });
  if (!resp.ok) throw new Error(`${resp.status}`);
}

async function main() {
  console.log("Fetching picture activities...");
  const activities = await fetchPictureActivities();
  console.log(`${activities.length} activities\n`);

  let totalAffected = 0;
  const stats = { resolve_numeric: 0, clear_prompt_text: 0 };

  for (const act of activities) {
    const { value: newContent, changes } = fixValues(act.content);
    if (changes.length === 0) continue;

    totalAffected++;
    for (const c of changes) {
      stats[c.action] = (stats[c.action] || 0) + 1;
      const label = c.action === "resolve_numeric" ? "🔢" : "📝→✕";
      console.log(`  ${label} ${c.path}: "${c.old.substring(0,60)}" → ${c.new || "NULL"}`);
    }
    console.log(`  📝 [${act.title || act.activity_id}] (${act.activity_type})`);

    if (!DRY_RUN) {
      try {
        await updateActivity(act.activity_id, newContent);
        console.log(`  ✅ UPDATED\n`);
      } catch (e) {
        console.log(`  ❌ ${e.message}\n`);
      }
    }
  }

  console.log(`${"=".repeat(50)}`);
  console.log(`Activities affected: ${totalAffected}`);
  console.log(`  Numeric IDs resolved: ${stats.resolve_numeric}`);
  console.log(`  Prompt text cleared: ${stats.clear_prompt_text}`);
  if (DRY_RUN) console.log(`(DRY RUN)`);
}

main().catch(console.error);
