/**
 * PASS 2: Fix number-only URLs that match legacy CSV.
 * Also investigate "no image fields" false positives.
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV_LEGACY = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json", "Prefer": "return=representation",
};

function parseLegacyCSV(filepath) {
  const map = new Map(); // filename → has prompt
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const comma = line.indexOf(",");
    if (comma === -1) continue;
    const id = line.substring(0, comma).trim();
    map.set(id, true);
    map.set(id.replace(".png", ""), true);
  }
  return map;
}

const legacyMap = parseLegacyCSV(CSV_LEGACY);
console.log(`Legacy CSV: ${legacyMap.size} entries\n`);

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function extractImages(content) {
  const refs = [];
  if (!content || typeof content !== "object") return refs;
  for (const [key, val] of Object.entries(content)) {
    if (typeof val === "string" && IMAGE_KEYS.has(key) && val) {
      refs.push({ path: key, value: val, key });
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          for (const r of extractImages(item)) refs.push({ ...r, path: `${key}[${i}].${r.path}` });
        } else if (typeof item === "string" && IMAGE_KEYS.has(key) && item) {
          refs.push({ path: `${key}[${i}]`, value: item, key });
        }
      });
    } else if (val && typeof val === "object") {
      for (const r of extractImages(val)) refs.push({ ...r, path: `${key}.${r.path}` });
    }
  }
  return refs;
}

function findUnit(act) {
  const str = JSON.stringify(act.content);
  let m = str.match(/g(\d+)u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  // Check if content has an 'image' field with unit path
  if (act.content?.image && typeof act.content.image === "string") {
    m = act.content.image.match(/g(\d+)u(\d+)/i);
    if (m) return `g${m[1]}u${m[2]}`;
  }
  return null;
}

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
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status}`);
}

async function main() {
  const activities = await fetchAll();
  console.log(`${activities.length} picture activities\n`);

  // ─── Analyze "no image fields" ───
  console.log("═══ NO IMAGE FIELDS ANALYSIS ═══\n");
  let truly_no_image = 0;
  let has_image_but_empty = 0;
  let has_other_media = 0;

  for (const act of activities) {
    const imgs = extractImages(act.content);
    if (imgs.length > 0) continue;

    const unit = findUnit(act) || "?";
    const topKeys = Object.keys(act.content || {});

    // Check if there's an image field that's empty/null
    const rawImage = act.content?.image;
    const rawImageUrl = act.content?.imageUrl;

    if ((rawImage === "" || rawImage === null || rawImage === undefined) &&
        (rawImageUrl === "" || rawImageUrl === null || rawImageUrl === undefined)) {
      // Check if other fields might carry images
      const hasOptionsWithImages = JSON.stringify(act.content).includes('"image"');
      if (hasOptionsWithImages) {
        has_other_media++;
        console.log(`  [DEEP NESTED] ${unit} ${act.title} (${act.activity_type}) — images in nested objects`);
      } else {
        truly_no_image++;
        console.log(`  [TRULY EMPTY] ${unit} ${act.title} (${act.activity_type}) — keys: ${topKeys.slice(0,4).join(", ")}`);
      }
    }
  }

  console.log(`\n  Truly no images: ${truly_no_image}`);
  console.log(`  Has nested images?: ${has_other_media}\n`);

  // ─── Number-only URL analysis ───
  console.log("═══ NUMBER-ONLY URLS ═══\n");
  let inLegacy = 0, notInLegacy = 0;
  const missingFns = new Set();

  for (const act of activities) {
    const imgs = extractImages(act.content);
    for (const img of imgs) {
      if (!img.value.startsWith(R2_BASE)) continue;
      const fn = img.value.split("/").pop() || "";
      if (!/^\d+\.\w+$/.test(fn)) continue;

      if (legacyMap.has(fn) || legacyMap.has(fn.replace(/\.[^.]+$/, ""))) {
        inLegacy++;
      } else {
        notInLegacy++;
        missingFns.add(fn);
      }
    }
  }

  console.log(`  In legacy CSV: ${inLegacy}`);
  console.log(`  NOT in legacy CSV: ${notInLegacy}`);
  if (missingFns.size > 0) {
    console.log(`  Missing filenames:`);
    for (const fn of Array.from(missingFns).sort()) console.log(`    ${fn}`);
  }

  // ─── Summary ───
  console.log(`\n═══ FIXABLE STATUS ═══`);
  console.log(`  ✅ Already done (Pass 1): 70 fixes (30 audio cleared + 40 legacy resolved)`);
  console.log(`  ✅ Number-only URLs OK: ${inLegacy} images have CSV prompts`);
  console.log(`  ⚠️  Number-only URLs missing CSV: ${notInLegacy} (need prompt entries)`);
  console.log(`  ⚠️  Truly no images: ${truly_no_image} activities (need images added)`);
  console.log(`  ⚠️  Placeholders: 124 (need manual image assignment)`);
}

main().catch(console.error);
