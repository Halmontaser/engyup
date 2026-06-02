/**
 * Match picture-description activities needing images against image_prompts.csv by lesson.
 */
const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHRzZWJhZmpnemxseWFic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyMDQyMywiZXhwIjoyMDkxNzk2NDIzfQ.H0Ec_0v4n1W4aLsLRObGKag5nTAIIt0ccsv88a8FAOU";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const CSV = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\image_prompts.csv";

const AUTH = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const HEADERS = { ...AUTH, "Content-Type": "application/json", "Prefer": "return=representation" };

// Parse CSV: only picture-description entries
const csvByLesson = new Map();
const t2 = fs.readFileSync(CSV, "utf8");
for (const l of t2.split(/\r?\n/).slice(1).filter(Boolean)) {
  const cols = []; let col = "", inq = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') { inq = !inq; continue }
    if (l[i] === "," && !inq) { cols.push(col.trim()); col = ""; continue }
    col += l[i];
  }
  cols.push(col.trim());
  if (cols.length < 7) continue;
  const [fn, prompt, actId, lesson, unit, grade, atype] = cols;
  if (atype !== "picture-description") continue;
  if (!csvByLesson.has(lesson)) csvByLesson.set(lesson, []);
  csvByLesson.get(lesson).push({ fn, prompt, unit, grade });
}
console.log(`CSV: ${csvByLesson.size} lessons with picture-description images\n`);

async function fetchNeeding() {
  const all = [];
  let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.picture-description&select=activity_id,lesson_id,title,content,book_type,book_page&limit=200&offset=${offset}`;
    const resp = await fetch(url, { headers: AUTH });
    if (!resp.ok) throw new Error(`Fetch: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < 200) break;
  }
  return all;
}

function hasValidUrl(a) {
  const img = a.content?.image;
  const iu = a.content?.imageUrl;
  return (typeof img === "string" && img.startsWith("http")) || (typeof iu === "string" && iu.startsWith("http"));
}

async function updateActivity(id, content) {
  const u = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(id)}`;
  const resp = await fetch(u, { method: "PATCH", headers: HEADERS, body: JSON.stringify({ content }) });
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status}`);
}

async function main() {
  const activities = await fetchNeeding();
  console.log(`${activities.length} picture-description activities total\n`);

  const needing = activities.filter(a => !hasValidUrl(a));
  console.log(`${needing.length} needing images\n`);

  let matched = 0, applied = 0;

  for (const a of needing) {
    const pics = csvByLesson.get(a.lesson_id);
    if (!pics || pics.length === 0) continue;

    // Take the first matching pic image
    const pic = pics[0];
    const unit = pic.unit;
    const r2Url = `${R2_BASE}/${unit}/images/${pic.fn}`;

    matched++;
    console.log(`[${a.title}] ${[a.book_type, a.book_page].filter(Boolean).join(" ")}`);
    console.log(`  → ${pic.fn} (${unit})`);
    console.log(`  Prompt: ${pic.prompt.substring(0, 100)}...`);

    // Apply
    const newContent = { ...a.content, image: r2Url };
    try {
      await updateActivity(a.activity_id, newContent);
      console.log(`  💾 UPDATED`);
      applied++;
    } catch (e) {
      console.log(`  💥 ${e.message}`);
    }
  }

  const remaining = needing.length - matched;
  console.log(`\nMatched: ${matched} | Applied: ${applied} | Unmatched: ${remaining}`);
}

main().catch(console.error);
