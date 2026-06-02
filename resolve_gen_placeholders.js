/**
 * Resolve "gen-*" placeholders by stripping prefix and
 * fuzzy-matching against image_prompts.csv filenames.
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

// ─── Parse image_prompts.csv → array of {filename, prompt, lesson, unit, grade, type} ───

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
console.log(`CSV loaded: ${allRows.length} rows\n`);

// ─── Fuzzy match a gen-placeholder against CSV ───

function genToPattern(genName) {
  // "gen-g10-u1-1.13-img-1" → try to match against CSV filenames
  const noGen = genName.replace(/^gen-/, "");
  // Split into parts
  // g10-u1-1.13-img-1 → grade=g10, unit=u1, lesson_part=1.13, rest=img-1
  return noGen;
}

function fuzzyMatch(genName, unit, activityType) {
  const noGen = genName.replace(/^gen-/, "").toLowerCase();
  const results = [];

  for (const row of allRows) {
    const fn = row.filename.toLowerCase();
    let score = 0;

    // Extract number parts from the gen name
    // e.g., "g10-u1-1.13-img-1" → numbers: 10, 1, 1, 13, 1
    const genParts = noGen.split(/[^a-z0-9]+/).filter(Boolean);

    // Check how many parts match the filename
    for (const part of genParts) {
      if (fn.includes(part)) score++;
    }

    // Bonus for matching unit
    if (unit && fn.includes(unit.toLowerCase())) score += 3;

    // Bonus for matching activity type
    const typeMap = {
      "picture-description": "pic",
      "gap-fill": "gap",
      "flashcard": "flsh|flash|fla",
      "mcq": "mcq",
      "true-false": "tf",
      "match-pairs": "mtch",
      "word-order": "wrd",
      "listening-comprehension": "lst|lis",
      "dialogue-read": "dlg",
      "reading-passage": "rdg",
      "category-sort": "cat",
      "spelling-bee": "spl",
      "dictation": "dic",
    };
    const typePattern = typeMap[activityType];
    if (typePattern && new RegExp(typePattern, "i").test(fn)) score += 2;

    if (score >= 3) {
      results.push({ row, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3); // top 3 matches
}

// ─── Also try to find by direct filename match after transformation ───

function directMatch(genName) {
  // "gen-g10-u1-1.13-img-1" → try:
  // g10_u1_l1.13_*_act*_i1.png pattern
  const noGen = genName.replace(/^gen-/, "");

  // Try to convert to CSV naming convention
  // g10-u1-1.13-img-1 → g10_u1_l1.13_*_i1
  const m = noGen.match(/g(\d+)-u(\d+)-(\d+\.\d+)-img-(\d+)/i);
  if (m) {
    const [_, grade, unit, lesson, idx] = m;
    const pattern = `g${grade}_u${unit}_l${lesson}`;
    for (const row of allRows) {
      if (row.filename.includes(pattern) && row.filename.includes(`_i${idx}`)) {
        return { row, method: "direct", score: 100 };
      }
      if (row.filename.includes(pattern) && row.filename.endsWith(`i${idx}.png`)) {
        return { row, method: "partial", score: 90 };
      }
    }
  }

  // Try simpler: just look for files containing the index number
  // gen-g10-u1-1.13-img-1 → look for files with g10_u1 and i1
  const simpleMatch = noGen.match(/g(\d+)-u(\d+)/i);
  if (simpleMatch) {
    const g = simpleMatch[1], u = simpleMatch[2];
    const idxMatch = noGen.match(/img-(\d+)/i) || noGen.match(/i(\d+)$/i);
    if (idxMatch) {
      const idx = idxMatch[1];
      for (const row of allRows) {
        if (row.filename.includes(`g${g}_u${u}`) && row.filename.includes(`_i${idx}`)) {
          return { row, method: "grade_unit_idx", score: 70 };
        }
      }
    }
  }

  return null;
}

// ─── Fetch & Fix ────────────────────────────────────

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
  if (act.content?.image && typeof act.content.image === "string") {
    const m2 = act.content.image.match(/g(\d+)u(\d+)/i);
    if (m2) return `g${m2[1]}u${m2[2]}`;
  }
  return null;
}

const IMAGE_KEYS = new Set(["image", "imageUrl", "imgUrl", "imageSrc"]);

function fixGenPlaceholders(content, unit, activityType, log) {
  if (!content || typeof content !== "object") return { value: content, changed: false };

  let changed = false;
  const result = Array.isArray(content) ? [] : {};

  for (const [key, val] of Object.entries(content)) {
    if (typeof val === "string" && IMAGE_KEYS.has(key) && /^gen-/.test(val)) {
      // Try direct match first
      const direct = directMatch(val);
      if (direct) {
        const r2Url = `${R2_BASE}/${direct.row.unit || unit}/${direct.row.filename.includes("/images/") ? "" : "images/"}${direct.row.filename}`;
        // Build proper R2 URL from CSV row
        const csvUnit = direct.row.unit || unit;
        const properUrl = `${R2_BASE}/${csvUnit}/images/${direct.row.filename}`;
        log.push({
          type: "gen_resolved",
          key: key,
          old: val,
          new: properUrl,
          matched: direct.row.filename,
          score: direct.score,
          method: direct.method,
        });
        result[key] = properUrl;
        changed = true;
        continue;
      }

      // Try fuzzy match
      const fuzzy = fuzzyMatch(val, unit, activityType);
      if (fuzzy.length > 0 && fuzzy[0].score >= 5) {
        const best = fuzzy[0];
        const csvUnit = best.row.unit || unit;
        const properUrl = `${R2_BASE}/${csvUnit}/images/${best.row.filename}`;
        log.push({
          type: "gen_fuzzy",
          key: key,
          old: val,
          new: properUrl,
          matched: best.row.filename,
          score: best.score,
          alternatives: fuzzy.slice(0, 3).map(f => f.row.filename),
        });
        result[key] = properUrl;
        changed = true;
        continue;
      }

      log.push({
        type: "gen_unmatched",
        key: key,
        old: val,
        topFuzzy: fuzzy.map(f => `${f.row.filename} (${f.score})`).slice(0, 3),
      });
    }

    // Recurse
    if (Array.isArray(val)) {
      const arr = [];
      let arrChanged = false;
      for (const item of val) {
        if (typeof item === "object" && item !== null) {
          const r = fixGenPlaceholders(item, unit, activityType, log);
          if (r.changed) arrChanged = true;
          arr.push(r.value);
        } else {
          arr.push(item);
        }
      }
      result[key] = arrChanged ? arr : val;
      if (arrChanged) changed = true;
    } else if (val && typeof val === "object") {
      const r = fixGenPlaceholders(val, unit, activityType, log);
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
  console.log(`${activities.length} picture activities\n`);

  let totalResolved = 0;
  let totalFuzzy = 0;
  let totalUnmatched = 0;
  let totalFixed = 0;

  for (const act of activities) {
    const unit = findUnit(act);
    const log = [];
    const result = fixGenPlaceholders(act.content, unit, act.activity_type, log);
    if (!result.changed) continue;

    const resolved = log.filter(l => l.type === "gen_resolved");
    const fuzzy = log.filter(l => l.type === "gen_fuzzy");
    const unmatched = log.filter(l => l.type === "gen_unmatched");

    totalResolved += resolved.length;
    totalFuzzy += fuzzy.length;
    totalUnmatched += unmatched.length;
    totalFixed++;

    console.log(`\n📝 [${act.title || act.activity_id}] (${act.activity_type}) unit=${unit || "?"}`);

    for (const r of resolved) {
      console.log(`  ✅ ${r.key}: "${r.old}" → ${r.matched} (${r.method}, score=${r.score})`);
    }
    for (const f of fuzzy) {
      console.log(`  🤖 ${f.key}: "${f.old}" → ${f.matched} (fuzzy, score=${f.score})`);
      console.log(`     alternatives: ${f.alternatives.join(", ")}`);
    }
    for (const u of unmatched) {
      console.log(`  ❌ ${u.key}: "${u.old}" — NO MATCH`);
      if (u.topFuzzy.length > 0) console.log(`     closest: ${u.topFuzzy.join(" | ")}`);
    }

    if (!DRY_RUN) {
      try {
        await updateActivity(act.activity_id, result.value);
        console.log(`  💾 UPDATED`);
      } catch (e) {
        console.log(`  💥 ${e.message}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Direct matches: ${totalResolved}`);
  console.log(`Fuzzy matches: ${totalFuzzy}`);
  console.log(`Unmatched: ${totalUnmatched}`);
  console.log(`Activities fixed: ${totalFixed}`);
  if (DRY_RUN) console.log(`(DRY RUN)`);
}

main().catch(console.error);
