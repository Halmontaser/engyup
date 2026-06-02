/**
 * Broad audit: find ANY activity (all types) where a TEXT field
 * contains an R2 URL ending in a number (corrupted by update-supabase-media.ts).
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node audit_all_urls.js
 */

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

// Media-specific field names — URLs in these are LEGITIMATE, skip them
const MEDIA_FIELDS = new Set([
  "image", "imageUrl", "imgUrl", "imageSrc",
  "audio", "audioUrl", "audioSrc", "wordAudio",
  "leftImage", "rightImage", "leftAudio", "rightAudio",
  "url",    // generic media url in media arrays
  "cover_image_src",
]);

async function fetchAllActivities() {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?select=activity_id,lesson_id,title,activity_type,content&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url, { headers: HEADERS });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

function findR2Urls(obj, path = "", parentKey = "") {
  const hits = [];
  if (!obj || typeof obj !== "object") return hits;

  if (typeof obj === "string") {
    if (obj.startsWith(R2_BASE) && !MEDIA_FIELDS.has(parentKey)) {
      const num = obj.match(/\/(\d+)\.\w+$/);
      if (num) {
        hits.push({ path, value: obj, number: num[1] });
      }
    }
    return hits;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      hits.push(...findR2Urls(item, `${path}[${i}]`, parentKey));
    });
  } else {
    for (const [key, val] of Object.entries(obj)) {
      hits.push(...findR2Urls(val, path ? `${path}.${key}` : key, key));
    }
  }
  return hits;
}

async function main() {
  console.log("Fetching ALL activities...");
  const activities = await fetchAllActivities();
  console.log(`Scanning ${activities.length} activities for R2 URLs in text fields...\n`);

  const byType = new Map();

  for (const act of activities) {
    const hits = findR2Urls(act.content);
    if (hits.length === 0) continue;

    const key = act.activity_type;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key).push({ activity: act, hits });
  }

  if (byType.size === 0) {
    console.log("✅ No R2 URLs found in text fields! All clean.");
    return;
  }

  let grandTotal = 0;
  for (const [type, items] of byType) {
    console.log(`\n─── ${type} (${items.length} activities) ───`);
    for (const { activity, hits } of items) {
      console.log(`  📝 [${activity.title || activity.activity_id}]`);
      for (const h of hits) {
        console.log(`     ${h.path}: "${h.value}" → should be "${h.number}"`);
        grandTotal++;
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`TOTAL: ${grandTotal} corrupted fields across ${Array.from(byType.values()).reduce((s, v) => s + v.length, 0)} activities`);
  console.log(`Activity types affected: ${Array.from(byType.keys()).join(", ")}`);
}

main().catch(console.error);
