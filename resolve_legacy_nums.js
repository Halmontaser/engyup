/**
 * Resolve ALL bare-number legacy IDs + "ID: NNN" patterns in ALL picture-description activities.
 * Uses db_images_export.csv + Supabase lesson→module→grade chain to find units.
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV_LEGACY = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\db_images_export.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const AUTH = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const HEADERS = { ...AUTH, "Content-Type": "application/json", "Prefer": "return=representation" };

// ─── Parse legacy CSV ───
const legacyNums = new Set();
const text = fs.readFileSync(CSV_LEGACY, "utf8");
for (const line of text.split(/\r?\n/).slice(1).filter(Boolean)) {
  const comma = line.indexOf(",");
  if (comma === -1) continue;
  const id = line.substring(0, comma).trim();
  legacyNums.add(id.replace(/\.(png|jpg|jpeg|gif)$/i, ""));
}
console.log(`Legacy IDs: ${legacyNums.size}\n`);

// ─── Fetch all picture-description activities ───
async function fetchAll(select) {
  const all = [];
  const limit = 1000; let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.picture-description&select=${select}&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url, { headers: AUTH });
    if (!resp.ok) throw new Error(`Fetch: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

// ─── Resolve lesson → unit via Supabase ───
async function buildUnitMap(activities) {
  const map = new Map();
  // Collect unique lesson_ids
  const lessonIds = new Set();
  for (const a of activities) {
    if (a.lesson_id) lessonIds.add(a.lesson_id);
  }
  if (lessonIds.size === 0) return map;

  // Try content-based first (fast path)
  for (const a of activities) {
    const str = JSON.stringify(a.content);
    let m = str.match(/g(\d+)u(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); continue; }
    m = (a.lesson_id || "").match(/g(\d+)-(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); }
  }

  // For remaining, batch-fetch lesson→module→grade
  const unresolved = activities.filter(a => !map.has(a.activity_id) && a.lesson_id);
  if (unresolved.length === 0) return map;

  // Batch fetch all unique lessons
  const uniqueLessonIds = [...new Set(unresolved.map(a => a.lesson_id))];
  const lessonModuleMap = new Map();

  // Fetch in batches of 100 (Supabase in-clause limit)
  for (let i = 0; i < uniqueLessonIds.length; i += 100) {
    const batch = uniqueLessonIds.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/lessons?id=in.(${ids})&select=id,module_id`;
    const resp = await fetch(url, { headers: AUTH });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const l of data || []) lessonModuleMap.set(l.id, l.module_id);
  }

  // Batch fetch all unique modules
  const uniqueModuleIds = [...new Set(lessonModuleMap.values())].filter(Boolean);
  const moduleGradeMap = new Map();

  for (let i = 0; i < uniqueModuleIds.length; i += 100) {
    const batch = uniqueModuleIds.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/modules?id=in.(${ids})&select=id,grade_id,title`;
    const resp = await fetch(url, { headers: AUTH });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const m of data || []) {
      const unitMatch = (m.title || "").match(/Unit\s*(\d+)/i);
      moduleGradeMap.set(m.id, { gradeId: m.grade_id, unitNum: unitMatch ? unitMatch[1] : null });
    }
  }

  // Batch fetch all unique grades
  const uniqueGradeIds = [...new Set([...moduleGradeMap.values()].map(v => v.gradeId).filter(Boolean))];
  const gradeNumMap = new Map();
  for (let i = 0; i < uniqueGradeIds.length; i += 100) {
    const batch = uniqueGradeIds.slice(i, i + 100);
    const ids = batch.map(id => `"${id}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/grades?id=in.(${ids})&select=id,grade_number`;
    const resp = await fetch(url, { headers: AUTH });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const g of data || []) gradeNumMap.set(g.id, g.grade_number);
  }

  // Compose unit names
  for (const a of unresolved) {
    const moduleId = lessonModuleMap.get(a.lesson_id);
    if (!moduleId) continue;
    const modInfo = moduleGradeMap.get(moduleId);
    if (!modInfo || !modInfo.gradeId || !modInfo.unitNum) continue;
    const gradeNum = gradeNumMap.get(modInfo.gradeId);
    if (!gradeNum) continue;
    map.set(a.activity_id, `g${gradeNum}u${modInfo.unitNum}`);
  }

  return map;
}

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function resolveLegacy(content, unit, log) {
  if (!content || typeof content !== "object") return { value: content, changed: false };
  let changed = false;
  const result = Array.isArray(content) ? [] : {};

  for (const [key, val] of Object.entries(content)) {
    if (IMAGE_KEYS.has(key) && val != null && val !== "" && (typeof val === "string" || typeof val === "number")) {
      const sv = String(val);
      if (sv.startsWith("http")) { result[key] = val; continue; }

      // Bare number
      if (/^\d+$/.test(sv.trim()) && legacyNums.has(sv.trim())) {
        const num = sv.trim();
        if (unit) {
          const r2Url = `${R2_BASE}/${unit}/images/${num}.png`;
          log.push({ type: "bare_num", key, old: sv, new: r2Url });
          result[key] = r2Url;
          changed = true;
          continue;
        } else {
          log.push({ type: "bare_num_no_unit", key, old: sv });
        }
      }

      // "ID: NNN" or "Image ID NNN"
      const idMatch = sv.match(/ID[:\s]*(\d+)/i);
      if (idMatch && legacyNums.has(idMatch[1])) {
        const num = idMatch[1];
        if (unit) {
          const r2Url = `${R2_BASE}/${unit}/images/${num}.png`;
          log.push({ type: "image_id_text", key, old: sv, new: r2Url });
          result[key] = r2Url;
          changed = true;
          continue;
        } else {
          log.push({ type: "image_id_text_no_unit", key, old: sv });
        }
      }
    }

    if (Array.isArray(val)) {
      const arr = []; let arrChanged = false;
      for (const item of val) {
        if (typeof item === "object" && item !== null) {
          const r = resolveLegacy(item, unit, log);
          if (r.changed) arrChanged = true;
          arr.push(r.value);
        } else { arr.push(item); }
      }
      result[key] = arrChanged ? arr : val;
      if (arrChanged) changed = true;
    } else if (val && typeof val === "object") {
      const r = resolveLegacy(val, unit, log);
      if (r.changed) changed = true;
      result[key] = r.value;
    } else {
      result[key] = val;
    }
  }
  return { value: result, changed };
}

async function updateActivity(id, content) {
  const u = `${SUPABASE_URL}/rest/v1/activities?activity_id=eq.${encodeURIComponent(id)}`;
  const resp = await fetch(u, {
    method: "PATCH", headers: HEADERS,
    body: JSON.stringify({ content }),
  });
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status}`);
}

async function main() {
  console.log("Fetching all picture-description activities...");
  const activities = await fetchAll("activity_id,lesson_id,title,content,book_type,book_page");
  console.log(`${activities.length} activities\n`);

  console.log("Building unit map from lesson hierarchy...");
  const unitMap = await buildUnitMap(activities);
  console.log(`Units resolved: ${unitMap.size}/${activities.length}\n`);

  let totalBare = 0, totalIdText = 0, totalFixed = 0;
  let noUnitBare = 0, noUnitId = 0;

  for (const act of activities) {
    const unit = unitMap.get(act.activity_id);
    const log = [];
    const result = resolveLegacy(act.content, unit, log);
    if (!result.changed) continue;

    const bare = log.filter(l => l.type === "bare_num");
    const idText = log.filter(l => l.type === "image_id_text");
    const bareNoUnit = log.filter(l => l.type === "bare_num_no_unit");
    const idNoUnit = log.filter(l => l.type === "image_id_text_no_unit");

    totalBare += bare.length;
    totalIdText += idText.length;
    noUnitBare += bareNoUnit.length;
    noUnitId += idNoUnit.length;
    if (bare.length + idText.length > 0) totalFixed++;

    const book = [act.book_type, act.book_page].filter(Boolean).join(" ") || "-";
    console.log(`\n📝 [${act.title}] ${book} unit=${unit || "?"}`);
    for (const b of bare) console.log(`  ✅ ${b.key}: "${b.old}" → ${b.new}`);
    for (const i of idText) console.log(`  ✅ ${i.key}: "${i.old}" → ${i.new}`);
    for (const b of bareNoUnit) console.log(`  ⚠️  ${b.key}: "${b.old}" — NO UNIT`);
    for (const i of idNoUnit) console.log(`  ⚠️  ${i.key}: "${i.old}" — NO UNIT`);

    if (!DRY_RUN && (bare.length + idText.length > 0)) {
      try { await updateActivity(act.activity_id, result.value); console.log(`  💾 UPDATED`); }
      catch (e) { console.log(`  💥 ${e.message}`); }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Resolved: ${totalBare} bare numbers + ${totalIdText} ID texts`);
  console.log(`Activities fixed: ${totalFixed}`);
  if (noUnitBare + noUnitId > 0) console.log(`No unit context: ${noUnitBare} bare + ${noUnitId} ID text`);
  if (DRY_RUN) console.log(`(DRY RUN)`);
}

main().catch(console.error);
