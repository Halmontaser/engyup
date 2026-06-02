/**
 * Categorize EVERY image reference in picture activities into buckets.
 * Then we know exactly what to fix.
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const CSV1 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";
const CSV2 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\image_prompts.csv";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

// ─── Parse CSVs ────────────────────────────────

function parseCSV1(filepath) {
  // db_images_export.csv: id.png,prompt
  const map = new Map();
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const comma = line.indexOf(",");
    if (comma === -1) continue;
    const id = line.substring(0, comma).trim();
    const prompt = line.substring(comma + 1).trim().replace(/^"/, "").replace(/"$/, "");
    map.set(id, prompt);
    // Also store just the number
    const num = id.replace(".png", "");
    if (!map.has(num)) map.set(num, prompt);
  }
  return map;
}

function parseCSV2(filepath) {
  const map = new Map();
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    // Parse quoted CSV properly
    const cols = [];
    let col = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(col.trim()); col = ""; continue; }
      col += ch;
    }
    cols.push(col.trim());
    if (cols.length < 7) continue;
    const [filename, prompt, activity, lesson, unit, grade, activity_type] = cols;
    const stem = filename.replace(/\.[^.]+$/, "");
    map.set(filename, { prompt, activity, lesson, unit, grade, activity_type });
    if (!map.has(stem)) map.set(stem, { prompt, activity, lesson, unit, grade, activity_type });
  }
  return map;
}

console.log("Parsing CSVs...");
const legacyMap = parseCSV1(CSV1);
const promptMap = parseCSV2(CSV2);
console.log(`  Legacy IDs: ${legacyMap.size}, Image prompts: ${promptMap.size}\n`);

// ─── Fetch ─────────────────────────────────────

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function extractAllImages(content, prefix = "") {
  const refs = [];
  if (!content || typeof content !== "object") return refs;
  for (const [key, val] of Object.entries(content)) {
    const fp = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "string" && IMAGE_KEYS.has(key) && val) {
      refs.push({ path: fp, value: val, parentKey: key });
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "object" && item !== null) refs.push(...extractAllImages(item, `${fp}[${i}]`));
        else if (typeof item === "string" && IMAGE_KEYS.has(key) && item) refs.push({ path: `${fp}[${i}]`, value: item, parentKey: key });
      });
    } else if (val && typeof val === "object") {
      refs.push(...extractAllImages(val, fp));
    }
  }
  return refs;
}

function categorize(value) {
  if (!value || typeof value !== "string") return "empty";

  // Audio URL in image field
  if (value.startsWith(R2_BASE) && /\/audio\/.+\.(mp3|ogg|wav|m4a)$/i.test(value)) return "audio_url_in_image";

  // R2 URL with number-only filename like .../14.png or .../27.png
  if (value.startsWith(R2_BASE)) {
    const fn = value.split("/").pop() || "";
    if (/^\d+\.\w+$/.test(fn)) return "number_filename_url";
    return "named_image_url";
  }

  // Legacy ID text: "ID: 701" or "ID: 701, Label: ..."
  if (/^ID:\s*\d+/.test(value)) return "legacy_id_text";

  // Placeholder: "needed"
  if (value === "needed") return "placeholder_needed";

  // Generic placeholder: "gen-*" or "image-of-*"
  if (/^(gen-|image-of-)/.test(value)) return "placeholder_gen";

  // Local path: /media/...
  if (value.startsWith("/media/")) return "local_path";

  // Other URL
  if (value.startsWith("http")) return "other_url";

  return "other_text";
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

function deduceUnit(act) {
  const str = JSON.stringify(act.content);
  const m = str.match(/g(\d+)u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  return "unknown";
}

async function main() {
  const activities = await fetchAll();
  console.log(`${activities.length} picture activities\n`);

  const buckets = {
    audio_url_in_image: [],
    number_filename_url: [],
    named_image_url: [],
    legacy_id_text: [],
    placeholder_needed: [],
    placeholder_gen: [],
    local_path: [],
    other_url: [],
    other_text: [],
    no_image_fields: [],
  };

  for (const act of activities) {
    const images = extractAllImages(act.content);
    if (images.length === 0) {
      buckets.no_image_fields.push(act);
      continue;
    }
    for (const img of images) {
      const cat = categorize(img.value);
      const unit = deduceUnit(act);
      buckets[cat].push({ act, img, unit });
    }
  }

  // Print summary
  console.log("═══════════════════════════════════════════════════");
  console.log("BUCKET SUMMARY");
  console.log("═══════════════════════════════════════════════════\n");

  const labels = {
    audio_url_in_image: "🔴 AUDIO URL in image field (MUST FIX)",
    number_filename_url: "🟡 Number-only filename URL (likely legacy mis-resolution)",
    named_image_url: "🟢 Named image URL (OK, just need prompt check)",
    legacy_id_text: "🟠 Legacy ID text like 'ID: 701'",
    placeholder_needed: "🔴 Placeholder 'needed'",
    placeholder_gen: "🔴 Placeholder gen-* / image-of-*",
    local_path: "🟡 Local /media/ path",
    other_url: "⚪ Other URL",
    other_text: "⚪ Other text",
    no_image_fields: "🔴 NO image fields at all",
  };

  for (const [bucket, items] of Object.entries(buckets)) {
    console.log(`${labels[bucket]}: ${items.length}`);
  }

  // Show details for problematic buckets
  for (const bucket of ["audio_url_in_image", "number_filename_url", "legacy_id_text", "placeholder_needed", "placeholder_gen", "no_image_fields"]) {
    const items = buckets[bucket];
    if (items.length === 0) continue;
    console.log(`\n─── ${labels[bucket]} (${items.length}) ───`);
    // Group by unit
    const byUnit = {};
    for (const { act, img, unit } of items) {
      if (!byUnit[unit]) byUnit[unit] = [];
      byUnit[unit].push({ act, img });
    }
    for (const [unit, unitItems] of Object.entries(byUnit).sort()) {
      console.log(`  ${unit}: ${unitItems.length}`);
      if (unitItems.length <= 5) {
        for (const { act, img } of unitItems) {
          console.log(`    ${act.title || act.activity_id} | ${img.path} = "${img.value.substring(0, 80)}"`);
        }
      }
    }
  }
}

main().catch(console.error);
