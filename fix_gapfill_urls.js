/**
 * Fix gap-fill activities where text fields were corrupted by the media URL
 * update script. Checks sentences[].text, blanks[].answer, blanks[].hint,
 * blanks[].alternatives, and explanation for R2 URLs.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_gapfill_urls.js --dry-run
 *   node fix_gapfill_urls.js
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
  if (!value || typeof value !== "string" || !value.startsWith(R2_BASE)) return null;
  try {
    const url = new URL(value);
    const filename = url.pathname.split("/").pop() || "";
    const stem = filename.replace(/\.[^.]+$/, "");
    return stem || null;
  } catch {
    return null;
  }
}

function fixString(val) {
  if (typeof val === "string" && val.startsWith(R2_BASE)) {
    const extracted = extractTextFromUrl(val);
    return extracted !== null ? { val: extracted, changed: true } : { val, changed: false };
  }
  return { val, changed: false };
}

async function fetchAllGapFills() {
  const all = [];
  const limit = 500;
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.gap-fill&select=activity_id,lesson_id,title,content&limit=${limit}&offset=${offset}`;
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
  console.log("Fetching all gap-fill activities...\n");
  const activities = await fetchAllGapFills();
  console.log(`Found ${activities.length} gap-fill activities\n`);

  let affected = 0;
  let fixedFields = 0;

  for (const act of activities) {
    const sentences = act.content?.sentences;
    if (!Array.isArray(sentences) || sentences.length === 0) continue;

    let activityChanged = false;
    const fixedSentences = sentences.map((s) => {
      const clean = { ...s };
      let changed = false;

      // Fix sentence text
      const textFix = fixString(s.text);
      if (textFix.changed) {
        console.log(`  ${act.activity_id}  text:  "${s.text}" → "${textFix.val}"`);
        clean.text = textFix.val;
        changed = true;
      }

      // Fix explanation
      const explFix = fixString(s.explanation);
      if (explFix.changed) {
        console.log(`  ${act.activity_id}  explanation: "${s.explanation}" → "${explFix.val}"`);
        clean.explanation = explFix.val;
        changed = true;
      }

      // Fix blanks array
      if (Array.isArray(s.blanks)) {
        const fixedBlanks = s.blanks.map((b) => {
          const cb = { ...b };
          let bChanged = false;

          const ansFix = fixString(b.answer);
          if (ansFix.changed) {
            console.log(`  ${act.activity_id}  blanks.answer: "${b.answer}" → "${ansFix.val}"`);
            cb.answer = ansFix.val;
            bChanged = true;
          }

          const hintFix = fixString(b.hint);
          if (hintFix.changed) {
            console.log(`  ${act.activity_id}  blanks.hint: "${b.hint}" → "${hintFix.val}"`);
            cb.hint = hintFix.val;
            bChanged = true;
          }

          // Fix alternatives array
          if (Array.isArray(b.alternatives)) {
            let altsChanged = false;
            const fixedAlts = b.alternatives.map((a) => {
              const aFix = fixString(a);
              if (aFix.changed) {
                console.log(`  ${act.activity_id}  blanks.alternative: "${a}" → "${aFix.val}"`);
                altsChanged = true;
              }
              return aFix.val;
            });
            if (altsChanged) { cb.alternatives = fixedAlts; bChanged = true; }
          }

          if (bChanged) { changed = true; fixedFields++; }
          return cb;
        });
        clean.blanks = fixedBlanks;
      }

      if (changed) { activityChanged = true; fixedFields++; }
      return clean;
    });

    if (!activityChanged) continue;

    affected++;
    console.log(`\n📝 [${act.title || act.activity_id}] (lesson: ${act.lesson_id})`);

    if (!DRY_RUN) {
      await updateActivity(act.activity_id, { ...act.content, sentences: fixedSentences });
      console.log(`  ✅ UPDATED`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Activities affected: ${affected}`);
  console.log(`Fields fixed: ${fixedFields}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
}

main().catch(console.error);
