/**
 * REPORT: Remaining issues in picture activities after Pass 1.
 * Categories that need manual attention:
 * - Placeholders ("needed", "gen-*", "image-of-*")
 * - Activities with NO image fields
 * - Number-only URLs: verify CSV prompt coverage
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const CSV1 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";
const CSV2 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\image_prompts.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

function parseCSV1(filepath) {
  const map = new Map();
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

function parseCSV2(filepath) {
  const map = new Map();
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
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
    const [filename] = cols;
    map.set(filename, true);
    map.set(filename.replace(/\.[^.]+$/, ""), true);
  }
  return map;
}

const legacyMap = parseCSV1(CSV1);
const promptMap = parseCSV2(CSV2);
console.log(`CSVs loaded: legacy=${legacyMap.size}, prompts=${promptMap.size}\n`);

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

function findUnit(act) {
  const str = JSON.stringify(act.content);
  const m = str.match(/g(\d+)u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  return "?";
}

async function main() {
  const activities = await fetchAll();

  // ─── Bucket: Placeholders ───
  const placeholders = [];
  // ─── Bucket: No image fields ───
  const noImages = [];
  // ─── Bucket: Number-only URLs ───
  const numberUrls = [];

  for (const act of activities) {
    const unit = findUnit(act);
    const images = extractAllImages(act.content);

    if (images.length === 0) {
      noImages.push({ act, unit });
      continue;
    }

    for (const img of images) {
      const val = img.value;

      // Placeholder check
      if (val === "needed") {
        placeholders.push({ act, unit, img, type: "needed" });
      } else if (/^(gen-|image-of-)/.test(val)) {
        placeholders.push({ act, unit, img, type: "gen" });
      }

      // Number-only URL check
      if (val.startsWith(R2_BASE)) {
        const fn = val.split("/").pop() || "";
        if (/^\d+\.\w+$/.test(fn)) {
          const hasLegacyPrompt = legacyMap.has(fn) || legacyMap.has(fn.replace(/\.[^.]+$/, ""));
          numberUrls.push({ act, unit, img, fn, hasLegacyPrompt });
        }
      }
    }
  }

  // ─── REPORT ───
  console.log("═══════════════════════════════════════════════════");
  console.log("REMAINING ISSUES AFTER PASS 1");
  console.log("═══════════════════════════════════════════════════\n");

  // ── Placeholders ──
  console.log(`## PLACEHOLDERS (${placeholders.length} total: ${placeholders.filter(p=>p.type==='needed').length} "needed", ${placeholders.filter(p=>p.type==='gen').length} "gen-*/image-of-*")\n`);
  const byUnitPh = {};
  for (const p of placeholders) {
    if (!byUnitPh[p.unit]) byUnitPh[p.unit] = [];
    byUnitPh[p.unit].push(p);
  }
  for (const [unit, items] of Object.entries(byUnitPh).sort()) {
    console.log(`### ${unit} (${items.length})`);
    // Group by activity
    const byAct = {};
    for (const item of items) {
      const key = item.act.activity_id;
      if (!byAct[key]) byAct[key] = { act: item.act, imgs: [] };
      byAct[key].imgs.push(item.img);
    }
    for (const [id, entry] of Object.entries(byAct)) {
      console.log(`  ${entry.act.title || id} (${entry.act.activity_type})`);
      console.log(`    instruction: "${(entry.act.instruction||'').substring(0,100)}"`);
      for (const img of entry.imgs) {
        console.log(`    → ${img.path} = "${img.value}"`);
      }
    }
  }

  // ── No image fields ──
  console.log(`\n\n## NO IMAGE FIELDS (${noImages.length} activities)\n`);
  const byUnitNo = {};
  for (const n of noImages) {
    if (!byUnitNo[n.unit]) byUnitNo[n.unit] = [];
    byUnitNo[n.unit].push(n);
  }
  for (const [unit, items] of Object.entries(byUnitNo).sort((a,b) => a[0].localeCompare(b[0]))) {
    console.log(`### ${unit} (${items.length})`);
    for (const item of items) {
      console.log(`  ${item.act.title || item.act.activity_id} (${item.act.activity_type})`);
      console.log(`    instruction: "${(item.act.instruction||'').substring(0,100)}"`);
      // Show top-level content keys for context
      const topKeys = Object.keys(item.act.content || {}).slice(0, 6).join(", ");
      console.log(`    content keys: ${topKeys}`);
    }
  }

  // ── Number-only URLs: CSV coverage ──
  const withPrompt = numberUrls.filter(n => n.hasLegacyPrompt);
  const withoutPrompt = numberUrls.filter(n => !n.hasLegacyPrompt);
  console.log(`\n\n## NUMBER-ONLY URLS (${numberUrls.length} total)`);
  console.log(`  With legacy CSV prompt: ${withPrompt.length}`);
  console.log(`  WITHOUT legacy CSV prompt: ${withoutPrompt.length}`);

  if (withoutPrompt.length > 0) {
    console.log(`\n### Missing from CSV (${withoutPrompt.length}):`);
    const uniqueFns = new Set(withoutPrompt.map(n => n.fn));
    for (const fn of Array.from(uniqueFns).sort()) console.log(`  ${fn}`);
  }
}

main().catch(console.error);
