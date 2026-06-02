/**
 * Audit + fix category-sort activities for R2 URLs in text fields
 * (categories[].name, categories[].items[]). Leaves categories[].image untouched.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_categorysort_urls.js --dry-run
 *   node fix_categorysort_urls.js
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

function extractTextFromUrl(value) {
  if (!value || typeof value !== "string" || !value.startsWith(R2_BASE)) return null;
  try {
    const filename = new URL(value).pathname.split("/").pop() || "";
    const stem = filename.replace(/\.[^.]+$/, "");
    return stem || null;
  } catch { return null; }
}

function fixString(val) {
  if (typeof val === "string" && val.startsWith(R2_BASE)) {
    const extracted = extractTextFromUrl(val);
    return extracted !== null ? { val: extracted, changed: true } : { val, changed: false };
  }
  return { val, changed: false };
}

async function fetchAll() {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.category-sort&select=activity_id,lesson_id,title,content&limit=${limit}&offset=${offset}`;
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

async function updateActivity(activityId, newContent) {
  const url = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(activityId)}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content: newContent }),
  });
  if (!resp.ok) throw new Error(`Update failed: ${resp.status} ${await resp.text()}`);
}

async function main() {
  console.log("Fetching all category-sort activities...");
  const activities = await fetchAll();
  console.log(`Found ${activities.length} category-sort activities\n`);

  let affected = 0;
  let fixedFields = 0;

  for (const act of activities) {
    const categories = act.content?.categories;
    if (!Array.isArray(categories) || categories.length === 0) continue;

    let activityChanged = false;
    const fixedCategories = categories.map((cat) => {
      const clean = { ...cat };
      let changed = false;

      // Fix category name
      const nameFix = fixString(cat.name);
      if (nameFix.changed) {
        console.log(`  ${act.activity_id}  name: "${cat.name}" → "${nameFix.val}"`);
        clean.name = nameFix.val;
        changed = true;
      }

      // Fix items array
      if (Array.isArray(cat.items)) {
        let itemsChanged = false;
        const fixedItems = cat.items.map((item) => {
          const fix = fixString(item);
          if (fix.changed) {
            console.log(`  ${act.activity_id}  item: "${item}" → "${fix.val}"`);
            itemsChanged = true;
          }
          return fix.val;
        });
        if (itemsChanged) { clean.items = fixedItems; changed = true; }
      }

      if (changed) { activityChanged = true; fixedFields++; }
      return clean;
    });

    if (!activityChanged) continue;

    affected++;
    console.log(`\n📝 [${act.title || act.activity_id}] (lesson: ${act.lesson_id})`);

    if (!DRY_RUN) {
      await updateActivity(act.activity_id, { ...act.content, categories: fixedCategories });
      console.log(`  ✅ UPDATED`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Activities affected: ${affected}`);
  console.log(`Fields fixed: ${fixedFields}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
}

main().catch(console.error);
