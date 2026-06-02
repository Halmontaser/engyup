/**
 * Audit + fix MCQ activities: find R2 URLs in text fields
 * (question, text, answer, explanation, options[].text, options[].feedback, plain string options).
 * Leaves image/audio fields untouched.
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJh...
 *   node fix_mcq_urls.js --dry-run
 *   node fix_mcq_urls.js
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

// Text fields in MCQs (NOT media fields)
const TEXT_FIELDS = new Set(["question", "text", "answer", "explanation", "feedback"]);

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

async function fetchAllMCQs() {
  const all = [];
  const limit = 1000;
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.mcq&select=activity_id,lesson_id,title,content&limit=${limit}&offset=${offset}`;
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
  console.log("Fetching all MCQ activities...");
  const activities = await fetchAllMCQs();
  console.log(`Found ${activities.length} MCQ activities\n`);

  let affected = 0;
  let fixedFields = 0;

  for (const act of activities) {
    const questions = act.content?.questions;
    if (!Array.isArray(questions) || questions.length === 0) continue;

    let activityChanged = false;
    const fixedQuestions = questions.map((q) => {
      const clean = { ...q };
      let changed = false;

      // Fix top-level text fields
      for (const f of ["question", "text", "answer", "explanation"]) {
        const fix = fixString(q[f]);
        if (fix.changed) {
          console.log(`  ${act.activity_id}  ${f}: "${q[f]}" → "${fix.val}"`);
          clean[f] = fix.val;
          changed = true;
        }
      }

      // Fix options array
      if (Array.isArray(q.options)) {
        const fixedOptions = q.options.map((opt) => {
          // Plain string option
          if (typeof opt === "string") {
            const fix = fixString(opt);
            if (fix.changed) {
              console.log(`  ${act.activity_id}  option: "${opt}" → "${fix.val}"`);
              changed = true;
            }
            return fix.val;
          }
          // Object option with text/image/audio/feedback
          if (opt && typeof opt === "object") {
            const co = { ...opt };
            let oChanged = false;
            for (const f of ["text", "feedback"]) {
              const fix = fixString(opt[f]);
              if (fix.changed) {
                console.log(`  ${act.activity_id}  option.${f}: "${opt[f]}" → "${fix.val}"`);
                co[f] = fix.val;
                oChanged = true;
              }
            }
            if (oChanged) changed = true;
            return co;
          }
          return opt;
        });
        clean.options = fixedOptions;
      }

      if (changed) { activityChanged = true; fixedFields++; }
      return clean;
    });

    if (!activityChanged) continue;

    affected++;
    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type}, lesson: ${act.lesson_id})`);

    if (!DRY_RUN) {
      await updateActivity(act.activity_id, { ...act.content, questions: fixedQuestions });
      console.log(`  ✅ UPDATED`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Activities affected: ${affected}`);
  console.log(`Fields fixed: ${fixedFields}`);
  if (DRY_RUN) console.log(`(DRY RUN — no changes made)`);
}

main().catch(console.error);
