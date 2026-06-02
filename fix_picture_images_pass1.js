/**
 * FIX PASS 1: Auto-fixable image issues in picture activities.
 *
 * 1. AUDIO URL in image field → clear it (audio doesn't belong in image)
 * 2. LEGACY ID text "ID: 701" → resolve to R2 URL via db_images_export.csv
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=...
 *   node fix_picture_images_pass1.js --dry-run
 *   node fix_picture_images_pass1.js
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV_LEGACY = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// ─── Parse legacy CSV: id.png → unit guess ──────────
// We need to guess which unit folder a legacy ID belongs to.
// Pattern: look for unit hints in the activity content.
function parseLegacyCSV(filepath) {
  const map = new Map();
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const comma = line.indexOf(",");
    if (comma === -1) continue;
    const id = line.substring(0, comma).trim();
    const num = id.replace(".png", "");
    map.set(num, id); // "701" → "701.png"
    map.set(id, id);
  }
  return map;
}

const legacyMap = parseLegacyCSV(CSV_LEGACY);
console.log(`Legacy IDs loaded: ${legacyMap.size}\n`);

// ─── Find unit from activity ─────────────────────────

function findUnit(act) {
  // Try content first
  const str = JSON.stringify(act.content);
  let m = str.match(/g(\d+)u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  // Try title
  m = (act.title || "").match(/g(\d+)\s*u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  return null;
}

function buildR2Url(legacyNum, unit) {
  // Guess unit folder for the legacy ID
  // Legacy IDs like 701 → g11u5, 560 → g10u3, etc.
  // If we know the unit, use it; otherwise try common patterns
  if (unit) return `${R2_BASE}/${unit}/images/${legacyNum}.png`;
  return null;
}

// ─── Deep fix ────────────────────────────────────────

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function fixDeep(obj, unit, parentKey = "", path = "", log = []) {
  if (!obj || typeof obj !== "object") return { value: obj, changed: false, log };

  // Handle arrays
  if (Array.isArray(obj)) {
    let changed = false;
    const arr = [];
    for (let i = 0; i < obj.length; i++) {
      const r = fixDeep(obj[i], unit, parentKey, `${path}[${i}]`, log);
      if (r.changed) changed = true;
      arr.push(r.value);
    }
    return { value: arr, changed, log };
  }

  const result = {};
  let changed = false;

  for (const [key, val] of Object.entries(obj)) {
    const fp = path ? `${path}.${key}` : key;

    if (typeof val === "string" && IMAGE_KEYS.has(key) && val) {
      // CASE 1: Audio URL in image field → clear it
      if (val.startsWith(R2_BASE) && /\/audio\/.+\.(mp3|ogg|wav|m4a)$/i.test(val)) {
        log.push({ type: "audio_in_image", path: fp, old: val, act: "CLEARED" });
        result[key] = ""; // clear it
        changed = true;
        continue;
      }

      // CASE 2: Legacy ID text "ID: 701" or "ID: 701, Label: ..."
      const idMatch = val.match(/^ID:\s*(\d+)/);
      if (idMatch) {
        const num = idMatch[1];
        if (legacyMap.has(num)) {
          const r2Url = buildR2Url(num, unit);
          if (r2Url) {
            log.push({ type: "legacy_id_resolved", path: fp, old: val, new: r2Url });
            result[key] = r2Url;
            changed = true;
            continue;
          } else {
            log.push({ type: "legacy_id_no_unit", path: fp, old: val, num });
          }
        } else {
          log.push({ type: "legacy_id_not_found", path: fp, old: val, num });
        }
      }
    }

    // Recurse
    if (typeof val === "object" && val !== null) {
      const r = fixDeep(val, unit, key, fp, log);
      if (r.changed) changed = true;
      result[key] = r.value;
    } else {
      result[key] = val;
    }
  }

  return { value: result, changed, log };
}

// ─── Fetch & fix ─────────────────────────────────────

async function fetchAll() {
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

async function updateActivity(id, content) {
  const u = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(id)}`;
  const resp = await fetch(u, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content }),
  });
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status} ${await resp.text()}`);
}

async function main() {
  const activities = await fetchAll();
  console.log(`${activities.length} picture activities\n`);

  let totalAudioCleared = 0;
  let totalLegacyResolved = 0;
  let totalLegacyNoUnit = 0;
  let totalLegacyNotFound = 0;
  let totalActivitiesFixed = 0;

  for (const act of activities) {
    const unit = findUnit(act);
    const log = [];
    const result = fixDeep(act.content, unit, "", "", log);
    if (!result.changed) continue;

    const audioClears = log.filter(l => l.type === "audio_in_image");
    const legacies = log.filter(l => l.type === "legacy_id_resolved");
    const noUnits = log.filter(l => l.type === "legacy_id_no_unit");
    const notFounds = log.filter(l => l.type === "legacy_id_not_found");

    totalAudioCleared += audioClears.length;
    totalLegacyResolved += legacies.length;
    totalLegacyNoUnit += noUnits.length;
    totalLegacyNotFound += notFounds.length;
    totalActivitiesFixed++;

    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type}) unit=${unit || "?"}`);
    for (const l of audioClears) {
      console.log(`   🎵→❌ ${l.path}: cleared audio URL "${l.old.substring(0, 60)}..."`);
    }
    for (const l of legacies) {
      console.log(`   🏷️→✅ ${l.path}: "${l.old}" → "${l.new}"`);
    }
    for (const l of noUnits) {
      console.log(`   🏷️→⚠️  ${l.path}: "${l.old}" — can't resolve (no unit context)`);
    }
    for (const l of notFounds) {
      console.log(`   🏷️→❌ ${l.path}: "${l.old}" — ID ${l.num} not in CSV`);
    }

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
  console.log(`Activities fixed: ${totalActivitiesFixed}`);
  console.log(`Audio URLs cleared: ${totalAudioCleared}`);
  console.log(`Legacy IDs resolved: ${totalLegacyResolved}`);
  console.log(`Legacy IDs (no unit): ${totalLegacyNoUnit}`);
  console.log(`Legacy IDs (not in CSV): ${totalLegacyNotFound}`);
  if (DRY_RUN) console.log(`(DRY RUN)`);
}

main().catch(console.error);
