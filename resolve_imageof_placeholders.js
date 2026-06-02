/**
 * Resolve remaining non-gen placeholders:
 * - "image-of-*" pattern
 * - "gen-kite-image" special case
 */

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const R2_BASE = "https://pub-97a5f93c54924fc18c9d3cbedfd29066.r2.dev";
const DRY_RUN = process.argv.includes("--dry-run");
const CSV2 = "E:\\Books\\english_images\\clean_english_project\\crescent-app\\public\\image_prompts.csv";

if (!SUPABASE_KEY) { console.error("❌ SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const HEADERS = {
  "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json", "Prefer": "return=representation",
};

function parseCSV2(filepath) {
  const rows = [];
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split(/\r?\n/).filter(Boolean).slice(1);
  for (const line of lines) {
    const cols = [];
    let col = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(col.trim()); col = ""; continue; }
      col += ch;
    }
    cols.push(col.trim());
    if (cols.length < 7) continue;
    const [filename, prompt, activity, lesson, unit, grade, activity_type] = cols;
    rows.push({ filename, prompt, activity, lesson, unit, grade, type: activity_type });
  }
  return rows;
}

const allRows = parseCSV2(CSV2);

function findBestMatch(keyword, unit) {
  const kw = keyword.toLowerCase();
  const results = [];
  for (const row of allRows) {
    let score = 0;
    const fn = row.filename.toLowerCase();
    if (fn.includes(kw)) score += 10;
    if (unit && fn.includes(unit.toLowerCase())) score += 5;
    if (score > 0) results.push({ row, score });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}

async function fetchAll() {
  const all = [];
  const limit = 1000; let offset = 0;
  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/activities?instruction=ilike.*picture*&select=activity_id,lesson_id,title,activity_type,instruction,content&limit=${limit}&offset=${offset}`;
    const resp = await fetch(url, { headers: HEADERS });
    if (!resp.ok) throw new Error(`Fetch: ${resp.status}`);
    const data = await resp.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    offset += data.length;
    if (data.length < limit) break;
  }
  return all;
}

function findUnit(act) {
  const str = JSON.stringify(act.content);
  const m = str.match(/g(\d+)u(\d+)/i);
  if (m) return `g${m[1]}u${m[2]}`;
  return null;
}

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function resolveImageOf(content, unit, activityType, log) {
  if (!content || typeof content !== "object") return { value: content, changed: false };
  let changed = false;
  const result = Array.isArray(content) ? [] : {};

  for (const [key, val] of Object.entries(content)) {
    if (typeof val === "string" && IMAGE_KEYS.has(key)) {
      // "image-of-socotra-dragon-tree" → keyword: "socotra"
      // "image-of-four-pens" → keyword: "pens"
      // "gen-kite-image" → keyword: "kite"
      let keyword = val.replace(/^image-of-/, "").replace(/^gen-/, "").replace(/-image$/, "");
      // Extract meaningful keywords
      keyword = keyword.replace(/-(one|two|three|four|five)$/, "");

      if (/^image-of-/.test(val) || val === "gen-kite-image") {
        const matches = findBestMatch(keyword, unit);
        if (matches.length > 0 && matches[0].score >= 10) {
          const best = matches[0];
          const csvUnit = best.row.unit || unit;
          const properUrl = `${R2_BASE}/${csvUnit}/images/${best.row.filename}`;
          log.push({
            type: "image_of_resolved",
            key, old: val, new: properUrl,
            matched: best.row.filename, score: best.score,
            alternatives: matches.map(m => m.row.filename),
          });
          result[key] = properUrl;
          changed = true;
          continue;
        }
        log.push({
          type: "image_of_unmatched",
          key, old: val, keyword,
          topMatches: matches.map(m => `${m.row.filename} (${m.score})`),
        });
      }
    }

    if (Array.isArray(val)) {
      const arr = []; let arrChanged = false;
      for (const item of val) {
        if (typeof item === "object" && item !== null) {
          const r = resolveImageOf(item, unit, activityType, log);
          if (r.changed) arrChanged = true;
          arr.push(r.value);
        } else { arr.push(item); }
      }
      result[key] = arrChanged ? arr : val;
      if (arrChanged) changed = true;
    } else if (val && typeof val === "object") {
      const r = resolveImageOf(val, unit, activityType, log);
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
    method: "PATCH",
    headers: { ...HEADERS, "Prefer": "return=minimal" },
    body: JSON.stringify({ content }),
  });
  if (!resp.ok) throw new Error(`Update ${id}: ${resp.status}`);
}

async function main() {
  const activities = await fetchAll();
  let totalResolved = 0, totalUnmatched = 0, totalFixed = 0;

  for (const act of activities) {
    const unit = findUnit(act);
    const log = [];
    const result = resolveImageOf(act.content, unit, act.activity_type, log);
    if (!result.changed) continue;

    const resolved = log.filter(l => l.type === "image_of_resolved");
    const unmatched = log.filter(l => l.type === "image_of_unmatched");
    totalResolved += resolved.length;
    totalUnmatched += unmatched.length;

    if (resolved.length > 0 || unmatched.length > 0) totalFixed++;

    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type}) unit=${unit || "?"}`);
    for (const r of resolved) {
      console.log(`  ✅ ${r.key}: "${r.old}" → ${r.matched} (score=${r.score})`);
    }
    for (const u of unmatched) {
      console.log(`  ❌ ${u.key}: "${u.old}" (keyword: ${u.keyword}) — NO MATCH`);
      if (u.topMatches.length > 0) console.log(`     closest: ${u.topMatches.join(" | ")}`);
    }

    if (!DRY_RUN && resolved.length > 0) {
      try { await updateActivity(act.activity_id, result.value); console.log(`  💾 UPDATED`); }
      catch (e) { console.log(`  💥 ${e.message}`); }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Resolved: ${totalResolved}, Unmatched: ${totalUnmatched}, Activities: ${totalFixed}`);
  if (DRY_RUN) console.log(`(DRY RUN)`);
}

main().catch(console.error);
