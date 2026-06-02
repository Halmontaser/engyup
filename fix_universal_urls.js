/**
 * UNIVERSAL FIX: scan ALL activities for R2 URLs in NON-media fields.
 * Extract filename stem (remove the URL, keep the number/text).
 *
 * Media fields (URLs here are LEGITIMATE, skip):
 *   image, imageUrl, imgUrl, imageSrc, src,
 *   audio, audioUrl, audioSrc, wordAudio,
 *   leftImage, rightImage, leftAudio, rightAudio,
 *   url (media array entries), cover_image_src
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_universal_urls.js --dry-run
 *   node fix_universal_urls.js
 */

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

// Fields where R2 URLs are CORRECT — never touch these
const MEDIA_KEYS = new Set([
  "image", "imageUrl", "imgUrl", "imageSrc", "src",
  "audio", "audioUrl", "audioSrc", "wordAudio",
  "leftImage", "rightImage", "leftAudio", "rightAudio",
  "url", "cover_image_src",
]);

function extractStem(url) {
  try {
    const filename = new URL(url).pathname.split("/").pop() || "";
    return filename.replace(/\.[^.]+$/, "");
  } catch { return null; }
}

/**
 * Recursively walk obj. For any string starting with R2_BASE whose parent
 * key is NOT in MEDIA_KEYS, extract the stem.
 * Returns { value, changed, fixes[] }.
 */
function fixDeep(obj, parentKey = "", path = "") {
  if (typeof obj === "string") {
    if (obj.startsWith(R2_BASE) && !MEDIA_KEYS.has(parentKey)) {
      const stem = extractStem(obj);
      if (stem) {
        return {
          value: stem,
          changed: true,
          fixes: [{ path: path || parentKey, old: obj, new: stem }],
        };
      }
    }
    return { value: obj, changed: false, fixes: [] };
  }

  if (Array.isArray(obj)) {
    let changed = false;
    const fixes = [];
    const newArr = obj.map((item, i) => {
      const result = fixDeep(item, parentKey, `${path}[${i}]`);
      if (result.changed) { changed = true; fixes.push(...result.fixes); }
      return result.value;
    });
    return { value: newArr, changed, fixes };
  }

  if (obj && typeof obj === "object") {
    let changed = false;
    const fixes = [];
    const newObj = {};
    for (const [key, val] of Object.entries(obj)) {
      const result = fixDeep(val, key, path ? `${path}.${key}` : key);
      if (result.changed) { changed = true; fixes.push(...result.fixes); }
      newObj[key] = result.value;
    }
    return { value: newObj, changed, fixes };
  }

  return { value: obj, changed: false, fixes: [] };
}

async function fetchAll() {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const u = `${SUPABASE_URL}/rest/v1/activities?select=activity_id,lesson_id,title,activity_type,content&limit=${limit}&offset=${offset}`;
    const resp = await fetch(u, { headers: HEADERS });
    if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

async function updateActivity(activityId, newContent) {
  const u = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(activityId)}`;
  const resp = await fetch(u, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content: newContent }),
  });
  if (!resp.ok) throw new Error(`Update failed: ${resp.status} ${await resp.text()}`);
}

async function main() {
  console.log("Fetching ALL activities...");
  const activities = await fetchAll();
  console.log(`Loaded ${activities.length} activities\n`);

  let totalAffected = 0;
  let totalFixes = 0;

  for (const act of activities) {
    const result = fixDeep(act.content);
    if (!result.changed) continue;

    totalAffected++;
    totalFixes += result.fixes.length;

    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type})`);
    for (const f of result.fixes) {
      console.log(`   ${f.path}:`);
      console.log(`     OLD: ${f.old}`);
      console.log(`     NEW: ${f.new}`);
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
  console.log(`Activities affected: ${totalAffected}`);
  console.log(`Total fixes: ${totalFixes}`);
  console.log(`Total activities scanned: ${activities.length}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
  else console.log(`✅ All fixes applied.`);
}

main().catch(console.error);
