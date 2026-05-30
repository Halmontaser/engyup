/**
 * Check and fix ALL flashcard imageUrls against the CSV mapping.
 *
 * Usage (from project root /home/harby/projects/engyup):
 *
 *   # Dry run first:
 *   npx tsx src/scripts/fix-flashcard-images.ts --dry-run
 *
 *   # Apply fixes:
 *   npx tsx src/scripts/fix-flashcard-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CSV_PATH = process.argv[2] || resolve("public/image_prompts.csv");
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_KEY) {
  console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY env var.");
  console.error("   export SUPABASE_SERVICE_ROLE_KEY='eyJh...'");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Parse CSV → map: "g10-1.3|2" → { filename, prompt } ─────────────────────
const flashMap = new Map<string, { filename: string; prompt: string }>();
const csvRaw = readFileSync(CSV_PATH, "utf-8");

for (const line of csvRaw.trim().split("\n").slice(1)) {
  const parts = parseCSV(line);
  if (!parts || parts[6] !== "flashcard") continue;
  const [filename, prompt, , lesson] = parts;
  const m = filename.match(/_i(\d+)\.png$/);
  if (!m) continue;
  const key = `${lesson}|${parseInt(m[1], 10)}`;
  if (!flashMap.has(key)) {
    flashMap.set(key, { filename, prompt: prompt.replace(/^"|"$/g, "") });
  }
}
console.log(`📋 ${flashMap.size} flashcard image mappings from CSV\n`);

// ── Query Supabase ───────────────────────────────────────────────────────────
async function main() {
  const { data: activities, error } = await supabase
    .from("activities")
    .select("activity_id, lesson_id, content, title")
    .eq("activity_type", "flashcard")
    .limit(500);

  if (error) { console.error("❌", error.message); process.exit(1); }

  const { data: lessons } = await supabase.from("lessons").select("id, order_index, module_id").limit(500);
  const { data: modules } = await supabase.from("modules").select("id, order_index").limit(50);

  const modUnit = new Map<string, number>();
  if (modules) for (const m of modules as any[]) modUnit.set(m.id, m.order_index || 1);

  const lessonKeyMap = new Map<string, string>();
  if (lessons) for (const l of lessons as any[])
    lessonKeyMap.set(l.id, `g10-${modUnit.get(l.module_id) || 1}.${l.order_index || 0}`);

  console.log(`🔍 Checking ${activities.length} flashcard activities...\n`);

  let fixed = 0, ok = 0, missing = 0;

  for (const act of activities as any[]) {
    const items = act.content?.items || act.content?.cards || [];
    if (!Array.isArray(items) || !items.length) continue;

    const lk = lessonKeyMap.get(act.lesson_id);
    if (!lk) continue;

    let changed = false;
    const updated = items.map((item: any, idx: number) => {
      const entry = flashMap.get(`${lk}|${idx}`);
      if (!entry) return item;

      const expected = `/media/g10/${entry.filename}`;
      if (item.imageUrl === expected) { ok++; return item; }

      console.log(`  ${item.imageUrl ? "⚠️  WRONG" : "➕ MISSING"}  ${lk}[${idx}] "${item.word || item.term || "?"}"  →  ${entry.filename}`);
      changed = true;
      missing++;
      return { ...item, imageUrl: expected };
    });

    if (changed) {
      if (!DRY_RUN) {
        const { error: upErr } = await supabase
          .from("activities").update({ content: { ...act.content, items: updated } })
          .eq("activity_id", act.activity_id);
        if (upErr) console.log(`  ❌ ${upErr.message}`);
        else console.log(`  ✅ ${act.title || act.activity_id}\n`);
      } else {
        console.log(`  [DRY RUN]\n`);
      }
      fixed++;
    }
  }

  console.log(`\n📊 ${ok} correct | ${missing} fixed | ${fixed} activities ${DRY_RUN ? "(dry run)" : "updated"}`);
}

function parseCSV(line: string): string[] | null {
  const p: string[] = []; let c = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { p.push(c.trim()); c = ""; }
    else c += ch;
  }
  p.push(c.trim());
  return p.length >= 7 ? p : null;
}

main().catch(console.error);
