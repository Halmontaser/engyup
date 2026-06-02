/**
 * AUDIT: Find all activities with "picture" in instruction,
 * cross-reference their images against image_prompts.csv,
 * report which images are missing prompts or broken.
 *
 * Processes unit by unit.
 *
 * Usage: node audit_picture_activities.js
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CSV_PATH = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\image_prompts.csv";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

// ─── Parse CSV ────────────────────────────────────────────────

function parseCSV(filepath) {
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return new Map();

  // Split by comma but respect quoted fields
  const parseLine = (line) => {
    const cols = [];
    let col = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(col.trim()); col = ""; continue; }
      col += ch;
    }
    cols.push(col.trim());
    return cols;
  };

  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 7) continue;
    const [filename, prompt, activity, lesson, unit, grade, activity_type] = cols;
    const ext = path.extname(filename).toLowerCase();
    const stem = filename.replace(/\.[^.]+$/, "");
    map.set(filename, { prompt, activity, lesson, unit, grade, activity_type, stem });
    // Also index by stem for fuzzy matching
    if (!map.has(stem)) map.set(stem, { prompt, activity, lesson, unit, grade, activity_type, stem, filename });
  }
  return map;
}

console.log("Parsing CSV...");
const csvMap = parseCSV(CSV_PATH);
console.log(`  ${csvMap.size} entries loaded\n`);

// ─── Fetch activities with "picture" in instruction ───────────

async function fetchPictureActivities() {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    // ilike = case-insensitive LIKE
    const url = `${SUPABASE_URL}/rest/v1/activities?instruction=ilike.*picture*&select=activity_id,lesson_id,title,activity_type,instruction,content&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url, { headers: HEADERS });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${await resp.text()}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

// ─── Extract image references from activity content ───────────

// Known image field names (these hold URLs/paths to images)
const IMAGE_FIELDS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);
// These keys contain sub-objects that have their own image fields
const CONTAINER_KEYS = new Set(["items", "cards", "questions", "sentences", "pairs", "categories", "statements", "words", "lines", "turns"]);

function extractImages(content, prefix = "") {
  const refs = [];
  if (!content || typeof content !== "object") return refs;

  for (const [key, val] of Object.entries(content)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (typeof val === "string") {
      if (IMAGE_FIELDS.has(key) && val) {
        const filename = val.split("/").pop() || val;
        refs.push({ path: fullPath, value: val, filename });
      }
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          refs.push(...extractImages(item, `${fullPath}[${i}]`));
        } else if (typeof item === "string" && IMAGE_FIELDS.has(key) && item) {
          const filename = item.split("/").pop() || item;
          refs.push({ path: `${fullPath}[${i}]`, value: item, filename });
        }
      });
    } else if (val && typeof val === "object") {
      refs.push(...extractImages(val, fullPath));
    }
  }
  return refs;
}

// ─── Look up in CSV ───────────────────────────────────────────

function lookupCSV(filename) {
  if (!filename) return null;
  // Direct match
  if (csvMap.has(filename)) return csvMap.get(filename);
  // Stem match
  const stem = filename.replace(/\.[^.]+$/, "");
  if (csvMap.has(stem)) return csvMap.get(stem);
  return null;
}

// ─── Deduce unit from activity ────────────────────────────────

function deduceUnit(activity) {
  // From lesson_id like "g10-1.1" patterns, or from content
  const contentStr = JSON.stringify(activity.content);
  const match = contentStr.match(/g(\d+)u(\d+)/i);
  if (match) return `g${match[1]}u${match[2]}`;
  // Try title
  const tMatch = (activity.title || "").match(/g(\d+)\s*u(\d+)/i);
  if (tMatch) return `g${tMatch[1]}u${tMatch[2]}`;
  return "unknown";
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("Fetching activities with 'picture' in instruction...");
  const activities = await fetchPictureActivities();
  console.log(`  ${activities.length} activities found\n`);

  // Group by unit
  const byUnit = new Map();
  for (const act of activities) {
    const unit = deduceUnit(act) || "unknown";
    if (!byUnit.has(unit)) byUnit.set(unit, []);
    byUnit.get(unit).push(act);
  }

  // Process unit by unit
  const sortedUnits = Array.from(byUnit.keys()).sort();
  let totalMissingPrompts = 0;
  let totalBrokenRefs = 0;
  let totalOk = 0;

  for (const unit of sortedUnits) {
    const acts = byUnit.get(unit);
    console.log(`\n${"=".repeat(70)}`);
    console.log(`UNIT: ${unit}  (${acts.length} activities with 'picture' in instruction)`);
    console.log(`${"=".repeat(70)}`);

    for (const act of acts) {
      const images = extractImages(act.content);
      if (images.length === 0) {
        console.log(`\n  ⚠️  [${act.title || act.activity_id}] (${act.activity_type})`);
        console.log(`     Instruction: "${(act.instruction || "").substring(0, 80)}..."`);
        console.log(`     ❌ NO image fields found in content — needs investigation`);
        continue;
      }

      let hasIssue = false;
      const issues = [];

      for (const img of images) {
        const csv = lookupCSV(img.filename);
        if (!csv) {
          issues.push(`  ❌ MISSING PROMPT: ${img.path} = "${img.value}" (filename: ${img.filename})`);
          totalMissingPrompts++;
          hasIssue = true;
        } else {
          totalOk++;
        }
      }

      if (hasIssue) {
        console.log(`\n  📝 [${act.title || act.activity_id}] (${act.activity_type})`);
        console.log(`     Instruction: "${(act.instruction || "").substring(0, 80)}..."`);
        console.log(`     Images: ${images.length} total`);
        issues.forEach(i => console.log(i));
      }
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Activities with 'picture' in instruction: ${activities.length}`);
  console.log(`Images with prompts (OK):               ${totalOk}`);
  console.log(`Images MISSING prompts:                  ${totalMissingPrompts}`);
  console.log(`Units with picture activities:           ${sortedUnits.length}`);
}

main().catch(console.error);
