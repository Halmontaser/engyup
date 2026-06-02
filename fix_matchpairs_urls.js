/**
 * Fix match-pairs activities where left/right text fields were corrupted
 * by the media URL update script. It walked ALL string values and
 * resolved bare filenames (like "1", "3", "5") to R2 URLs.
 *
 * Restores original text by extracting it from the URL filename.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_matchpairs_urls.js --dry-run
 *   node fix_matchpairs_urls.js
 */

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");

const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";

if (!SUPABASE_KEY) {
  console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const HEADERS = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

function extractTextFromUrl(value) {
  if (!value.startsWith(R2_BASE)) return null;
  try {
    const url = new URL(value);
    const filename = url.pathname.split("/").pop() || "";
    const stem = filename.replace(/\.[^.]+$/, "");
    return stem || null;
  } catch {
    return null;
  }
}

async function fetchAllMatchPairs() {
  const all = [];
  const limit = 500;
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.match-pairs&select=activity_id,lesson_id,title,content&limit=${limit}&offset=${offset}`;
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
  console.log("Fetching all match-pairs activities...\n");
  const activities = await fetchAllMatchPairs();
  console.log(`Found ${activities.length} match-pairs activities\n`);

  let affected = 0;
  let fixedPairs = 0;

  for (const act of activities) {
    const pairs = act.content?.pairs;
    if (!Array.isArray(pairs) || pairs.length === 0) continue;

    let pairChanged = false;
    const fixed = pairs.map((p) => {
      const clean = { ...p };
      let changed = false;

      if (typeof p.left === "string" && p.left.startsWith(R2_BASE)) {
        const extracted = extractTextFromUrl(p.left);
        if (extracted) {
          console.log(`  ${act.activity_id}  left:  "${p.left}" → "${extracted}"`);
          clean.left = extracted;
          changed = true;
        }
      }

      if (typeof p.right === "string" && p.right.startsWith(R2_BASE)) {
        const extracted = extractTextFromUrl(p.right);
        if (extracted) {
          console.log(`  ${act.activity_id}  right: "${p.right}" → "${extracted}"`);
          clean.right = extracted;
          changed = true;
        }
      }

      if (changed) { pairChanged = true; fixedPairs++; }
      return clean;
    });

    if (!pairChanged) continue;

    affected++;
    console.log(`\n📝 [${act.title || act.activity_id}] (lesson: ${act.lesson_id})`);

    if (!DRY_RUN) {
      await updateActivity(act.activity_id, { ...act.content, pairs: fixed });
      console.log(`  ✅ UPDATED`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Activities affected: ${affected}`);
  console.log(`Pairs fixed: ${fixedPairs}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
}

main().catch(console.error);
