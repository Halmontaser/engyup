/**
 * Generate CSV of picture-description activities needing manual image assignment.
 * Organized by book (PB/WB) and page number.
 */

const fs = require("fs");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const OUT = "picture_description_needing_images.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const AUTH = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

async function fetchAll() {
  const all = [];
  const limit = 1000; let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?activity_type=eq.picture-description&select=activity_id,lesson_id,title,instruction,content,book_type,book_page&limit=${limit}&offset=${offset}`;
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

function isOK(act) {
  const img = act.content?.image;
  const imgUrl = act.content?.imageUrl;
  if (typeof img === "string" && img.startsWith("http")) return true;
  if (typeof imgUrl === "string" && imgUrl.startsWith("http")) return true;
  return false;
}

function classify(act) {
  const img = act.content?.image;
  const imgUrl = act.content?.imageUrl;
  if (!img && !imgUrl) return "EMPTY";
  if (img === "needed" || img === "" || img === null || img === undefined) return "PLACEHOLDER";
  if (typeof img === "string" && img.startsWith("http")) return "OK";
  if (imgUrl && typeof imgUrl === "string" && imgUrl.startsWith("http")) return "OK";
  return "OTHER";
}

async function buildUnitMap(activities) {
  const map = new Map();
  for (const a of activities) {
    const str = JSON.stringify(a.content);
    let m = str.match(/g(\d+)u(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); continue; }
    m = (a.lesson_id || "").match(/g(\d+)-(\d+)/i);
    if (m) { map.set(a.activity_id, `g${m[1]}u${m[2]}`); }
  }
  return map;
}

async function main() {
  const activities = await fetchAll();
  const unitMap = await buildUnitMap(activities);

  const needing = activities.filter(a => !isOK(a));

  // Sort by book_type, then book_page numeric, then title
  needing.sort((a, b) => {
    const btA = a.book_type || "ZZ";
    const btB = b.book_type || "ZZ";
    if (btA !== btB) return btA.localeCompare(btB);
    const pA = parseInt(a.book_page) || 999;
    const pB = parseInt(b.book_page) || 999;
    if (pA !== pB) return pA - pB;
    return (a.title || "").localeCompare(b.title || "");
  });

  // CSV columns: title, book_type, book_page, unit, status, current_image, instruction_preview, activity_id
  const rows = [["title","book","page","unit","status","current_image","instruction","activity_id"]];

  for (const a of needing) {
    const img = a.content?.image;
    const imgUrl = a.content?.imageUrl;
    const current = img || imgUrl || "";
    const status = classify(a);
    const unit = unitMap.get(a.activity_id) || "";
    const instruction = (a.instruction || "").replace(/"/g, '""').substring(0, 150);

    rows.push([
      `"${(a.title||"").replace(/"/g,'""')}"`,
      a.book_type || "",
      a.book_page || "",
      unit,
      status,
      `"${String(current).replace(/"/g,'""').substring(0, 80)}"`,
      `"${instruction}"`,
      a.activity_id,
    ]);
  }

  const csv = rows.map(r => r.join(",")).join("\n");
  fs.writeFileSync(OUT, "\uFEFF" + csv, "utf8"); // BOM for Excel

  console.log(`Written: ${OUT}`);
  console.log(`Total needing images: ${needing.length}`);
  console.log(`  EMPTY: ${needing.filter(a=>classify(a)==='EMPTY').length}`);
  console.log(`  PLACEHOLDER: ${needing.filter(a=>classify(a)==='PLACEHOLDER').length}`);
  console.log(`  OTHER: ${needing.filter(a=>classify(a)==='OTHER').length}`);

  // Also print a quick summary by unit
  const byUnit = {};
  for (const a of needing) {
    const u = unitMap.get(a.activity_id) || "?";
    if (!byUnit[u]) byUnit[u] = 0;
    byUnit[u]++;
  }
  console.log("\nBy unit:");
  for (const [u, c] of Object.entries(byUnit).sort()) {
    console.log(`  ${u}: ${c}`);
  }
}

main().catch(console.error);
