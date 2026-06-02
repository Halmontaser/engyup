/**
 * Deep probe: check the actual image field values for
 * activities flagged as "no image fields".
 */

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function deepProbeImages(content, prefix = "") {
  const findings = [];
  if (!content || typeof content !== "object") return findings;

  // Check top-level image/imageUrl
  for (const key of ["image", "imageUrl", "imgUrl"]) {
    const val = content[key];
    if (val === undefined || val === null) continue;
    if (typeof val === "string") {
      findings.push({ path: prefix + key, type: "string", value: val.substring(0, 120) });
    } else if (typeof val === "object") {
      findings.push({ path: prefix + key, type: "object", keys: Object.keys(val).join(", ") });
    } else {
      findings.push({ path: prefix + key, type: typeof val, value: String(val).substring(0, 80) });
    }
  }

  // Check top-level images array
  if (Array.isArray(content.images)) {
    content.images.forEach((img, i) => {
      if (typeof img === "object" && img !== null) {
        const url = img.url || img.src || img.imageUrl || "";
        findings.push({ path: `${prefix}images[${i}]`, type: "array_item", value: String(url).substring(0, 120) });
      }
    });
  }

  // Check pairs for leftImage/rightImage
  if (Array.isArray(content.pairs)) {
    let foundAny = false;
    content.pairs.forEach((p, i) => {
      if (p.leftImage || p.rightImage) {
        if (!foundAny) { foundAny = true; findings.push({ path: `${prefix}pairs`, type: "has_leftRightImage", value: `${content.pairs.length} pairs with images` }); }
      }
    });
  }

  // Check options within questions/items
  for (const container of ["questions", "items", "cards", "sentences", "statements"]) {
    if (!Array.isArray(content[container])) continue;
    let hasNestedImg = false;
    content[container].forEach((item, i) => {
      for (const key of IMAGE_KEYS) {
        if (item && typeof item === "object" && item[key]) {
          hasNestedImg = true;
        }
      }
      // Check options within questions
      if (Array.isArray(item?.options)) {
        item.options.forEach((opt, j) => {
          for (const key of IMAGE_KEYS) {
            if (opt && typeof opt === "object" && opt[key]) {
              hasNestedImg = true;
            }
          }
        });
      }
    });
    if (hasNestedImg) findings.push({ path: `${prefix}${container}`, type: "nested_images", value: `${content[container].length} items with images` });
  }

  // Check items_to_sort
  if (Array.isArray(content.items_to_sort)) {
    findings.push({ path: `${prefix}items_to_sort`, type: "items_to_sort", value: `${content.items_to_sort.length} items` });
  }

  return findings;
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
  return m ? `g${m[1]}u${m[2]}` : "?";
}

async function main() {
  const activities = await fetchAll();

  // Only look at activities where my simple extractor finds nothing
  let trulyEmpty = 0;
  let hasHiddenImages = 0;

  for (const act of activities) {
    // Skip if simple extractor finds images
    let simpleFound = false;
    for (const key of IMAGE_KEYS) {
      if (typeof act.content?.[key] === "string" && act.content[key]) simpleFound = true;
    }
    // Also check nested
    for (const container of ["questions", "items", "cards", "sentences", "statements", "pairs"]) {
      if (!Array.isArray(act.content?.[container])) continue;
      for (const item of act.content[container]) {
        if (!item || typeof item !== "object") continue;
        for (const key of IMAGE_KEYS) {
          if (typeof item[key] === "string" && item[key]) simpleFound = true;
        }
      }
    }
    if (simpleFound) continue;

    const unit = findUnit(act);
    const findings = deepProbeImages(act.content);

    if (findings.length === 0) {
      trulyEmpty++;
      console.log(`\n[EMPTY] ${unit} ${act.title} (${act.activity_type})`);
      console.log(`  content keys: ${Object.keys(act.content||{}).slice(0,8).join(", ")}`);
    } else {
      hasHiddenImages++;
      console.log(`\n[HIDDEN] ${unit} ${act.title} (${act.activity_type})`);
      for (const f of findings) {
        console.log(`  ${f.path}: [${f.type}] ${f.value || f.keys}`);
      }
    }
  }

  console.log(`\n═══ SUMMARY ═══`);
  console.log(`Has hidden images (need better extractor): ${hasHiddenImages}`);
  console.log(`Truly empty (need images added): ${trulyEmpty}`);
}

main().catch(console.error);
