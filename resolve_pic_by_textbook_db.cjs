/**
 * Resolve picture-description images using textbook_data.db
 * Matches by grade + book_type + book_page → finds image IDs → builds R2 URLs.
 */
const { DatabaseSync } = require("node:sqlite");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHRzZWJhZmpnemxseWFic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjIyMDQyMywiZXhwIjoyMDkxNzk2NDIzfQ.H0Ec_0v4n1W4aLsLRObGKag5nTAIIt0ccsv88a8FAOU";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DB_PATH = "E:/Books/english_images/clean_english_project/textbook_data.db";

const AUTH = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const HEADERS = { ...AUTH, "Content-Type": "application/json", "Prefer": "return=representation" };

const db = new DatabaseSync(DB_PATH, { readOnly: true });

// ─── Build page→image lookup from textbook DB ───
// grade_number + book_type_code + page_number → [image_ids]
const pageImageMap = new Map();
const rows = db.prepare(`
  SELECT g.grade_number, bt.code as book, p.page_number, i.id as img_id, i.label
  FROM images i
  JOIN pages p ON i.page_id = p.id
  JOIN book_types bt ON p.book_type_id = bt.id
  JOIN grades g ON p.grade_id = g.id
  ORDER BY i.id
`).all();

for (const r of rows) {
  const key = `${r.grade_number}|${r.book}|${r.page_number}`;
  if (!pageImageMap.has(key)) pageImageMap.set(key, []);
  pageImageMap.get(key).push({ imgId: r.img_id, label: r.label });
}
console.log(`DB: ${pageImageMap.size} unique (grade,book,page) combos with ${rows.length} images\n`);

// ─── Fetch all picture-description activities ───
async function fetchAll() {
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

// ─── Resolve grade from content or lesson hierarchy ───
function gradeFromUnit(u) {
  const m = (u || "").match(/^g(\d+)u/);
  return m ? parseInt(m[1]) : null;
}

async function buildUnitMap(activities) {
  const map = new Map();
  // Fast path: content-based
  for (const a of activities) {
    const str = JSON.stringify(a.content);
    let m = str.match(/g(\d+)u(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); continue; }
    m = (a.lesson_id || "").match(/g(\d+)-(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); }
  }

  // Slow path: lesson hierarchy for remaining
  const unresolved = activities.filter(a => !map.has(a.activity_id) && a.lesson_id);
  if (unresolved.length === 0) return map;

  const uniqueLessons = [...new Set(unresolved.map(a => a.lesson_id))];
  const lessonMod = new Map();
  for (let i = 0; i < uniqueLessons.length; i += 100) {
    const batch = uniqueLessons.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/lessons?id=in.(${ids})&select=id,module_id`, { headers: AUTH });
    if (!resp.ok) continue;
    for (const l of await resp.json()) lessonMod.set(l.id, l.module_id);
  }

  const uniqueMods = [...new Set(lessonMod.values())].filter(Boolean);
  const modGrade = new Map();
  for (let i = 0; i < uniqueMods.length; i += 100) {
    const batch = uniqueMods.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/modules?id=in.(${ids})&select=id,grade_id,title`, { headers: AUTH });
    if (!resp.ok) continue;
    for (const m of await resp.json()) {
      const uMatch = (m.title || "").match(/Unit\s*(\d+)/i);
      modGrade.set(m.id, { gradeId: m.grade_id, unitNum: uMatch ? uMatch[1] : null });
    }
  }

  const uniqueGrades = [...new Set([...modGrade.values()].map(v => v.gradeId).filter(Boolean))];
  const gradeNum = new Map();
  for (let i = 0; i < uniqueGrades.length; i += 100) {
    const batch = uniqueGrades.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/grades?id=in.(${ids})&select=id,grade_number`, { headers: AUTH });
    if (!resp.ok) continue;
    for (const g of await resp.json()) gradeNum.set(g.id, g.grade_number);
  }

  for (const a of unresolved) {
    const modId = lessonMod.get(a.lesson_id);
    if (!modId) continue;
    const info = modGrade.get(modId);
    if (!info || !info.gradeId || !info.unitNum) continue;
    const gn = gradeNum.get(info.gradeId);
    if (!gn) continue;
    map.set(a.activity_id, `g${gn}u${info.unitNum}`);
  }
  return map;
}

async function updateActivity(id, content) {
  const u = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(id)}`;
  const resp = await fetch(u, { method: "PATCH", headers: HEADERS, body: JSON.stringify({ content }) });
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status}`);
}

async function main() {
  const activities = await fetchAll();
  console.log(`${activities.length} picture-description activities\n`);

  console.log("Building unit map...");
  const unitMap = await buildUnitMap(activities);
  console.log(`Units resolved: ${unitMap.size}/${activities.length}\n`);

  const needing = activities.filter(a => !hasValidUrl(a));
  console.log(`${needing.length} needing images\n`);

  let matched = 0, noBook = 0, noGrade = 0, noImages = 0, applied = 0;

  for (const a of needing) {
    const bookCode = (a.book_type || "").trim();
    const pageNum = a.book_page;
    const unit = unitMap.get(a.activity_id);
    const grade = gradeFromUnit(unit);

    if (!bookCode || pageNum === null || pageNum === undefined || pageNum === "") {
      noBook++;
      continue;
    }
    let effectiveGrade = grade;
    let effectiveUnit = unit;

    if (!effectiveGrade) {
      // Try all grades — find first matching (grade, book, page) combo
      let found = null;
      for (const [k, imgs] of pageImageMap) {
        const parts = k.split("|");
        if (parts[1] === bookCode && parts[2] === String(pageNum)) {
          found = { grade: parseInt(parts[0]), images: imgs };
          break;
        }
      }
      if (!found) { noGrade++; continue; }
      effectiveGrade = found.grade;
      effectiveUnit = `g${found.grade}u1`; // guess unit=1
      // Override images lookup
      var images = found.images;
    } else {
      const key = `${effectiveGrade}|${bookCode}|${pageNum}`;
      var images = pageImageMap.get(key);
    }

    if (!images || images.length === 0) {
      noImages++;
      continue;
    }

    const img = images[0];
    const r2Url = `${R2_BASE}/${effectiveUnit}/images/${img.imgId}.png`;
    matched++;

    const gradeLabel = grade ? `G${grade}` : `G${effectiveGrade}*`;
    console.log(`[${a.title}] ${bookCode} p${pageNum} ${gradeLabel} unit=${effectiveUnit}`);
    console.log(`  → Image ID ${img.imgId}.png (${img.label || "no label"})`);
    console.log(`  → ${r2Url}`);

    const newContent = { ...a.content, image: r2Url };
    try {
      await updateActivity(a.activity_id, newContent);
      console.log(`  💾 UPDATED`);
      applied++;
    } catch (e) {
      console.log(`  💥 ${e.message}`);
    }
  }

  console.log(`\n============================================`);
  console.log(`Matched:     ${matched}`);
  console.log(`Applied:     ${applied}`);
  console.log(`No book ref: ${noBook}`);
  console.log(`No grade:    ${noGrade}`);
  console.log(`No images:   ${noImages}`);
}

main().catch(console.error);
