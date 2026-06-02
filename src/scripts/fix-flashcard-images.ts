/**
 * Check and fix ALL flashcard imageUrls against the CSV mapping.
 * Uses lesson|actIndex|itemIndex to handle multiple flashcard sets per lesson.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const CSV_PATH = "E:/Books/english_images/clean_english_project/crescent-app/public/image_prompts.csv";
const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CSV → map: "g10-1.3|0|2" → { filename, prompt }
const flashMap = new Map<string, { filename: string; prompt: string }>();
const csvRaw = readFileSync(CSV_PATH, "utf-8");

for (const line of csvRaw.trim().split("\n").slice(1)) {
  const p = parseCSV(line);
  if (!p || p[6] !== "flashcard") continue;
  const [filename, prompt, , lesson] = p;
  const m = filename.match(/_act(\d+)_i(\d+)\.png$/);
  if (!m) continue;
  const key = `${lesson}|${parseInt(m[1], 10)}|${parseInt(m[2], 10)}`;
  if (!flashMap.has(key)) flashMap.set(key, { filename, prompt: prompt.replace(/^"|"$/g, "") });
}
console.log(`📋 ${flashMap.size} flashcard image mappings\n`);

async function main() {
  const { data: activities } = await supabase
    .from("activities").select("activity_id, lesson_id, content, title, order_index")
    .eq("activity_type", "flashcard").limit(500);

  if (!activities) { console.error("❌ No activities"); process.exit(1); }

  const { data: lessons } = await supabase.from("lessons").select("id, order_index, module_id").limit(500);
  const { data: modules } = await supabase.from("modules").select("id, order_index").limit(50);

  const modMap = new Map<string, number>();
  if (modules) for (const m of modules as any[]) modMap.set(m.id, m.order_index || 1);

  // Build lesson key → lesson_id map
  const lessonKeys = new Map<string, string>();
  if (lessons) for (const l of lessons as any[]) {
    const unitNum = modMap.get(l.module_id) || 1;
    lessonKeys.set(l.id, `g10-${unitNum}.${l.order_index || 0}`);
  }

  // Group activities by lesson, sorted by order_index to derive actIndex
  const byLesson = new Map<string, any[]>();
  for (const a of activities as any[]) {
    if (!byLesson.has(a.lesson_id)) byLesson.set(a.lesson_id, []);
    byLesson.get(a.lesson_id)!.push(a);
  }
  for (const [, acts] of byLesson) acts.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

  console.log(`🔍 Checking ${activities.length} activities...\n`);

  let ok = 0, fixed = 0, missing = 0;

  for (const [lessonId, acts] of byLesson) {
    const lk = lessonKeys.get(lessonId);
    if (!lk) continue;

    for (let actIdx = 0; actIdx < acts.length; actIdx++) {
      const act = acts[actIdx];
      const items = act.content?.items || act.content?.cards || [];
      if (!Array.isArray(items) || !items.length) continue;

      let changed = false;
      const updated = items.map((item: any, itemIdx: number) => {
        const entry = flashMap.get(`${lk}|${actIdx}|${itemIdx}`);
        if (!entry) return item;
        const expected = `/media/g10/${entry.filename}`;
        if (item.imageUrl === expected) { ok++; return item; }
        console.log(`  ${item.imageUrl ? "⚠️  WRONG" : "➕ MISSING"}  ${lk}[act${actIdx}][${itemIdx}] "${item.word || item.term || "?"}" → ${entry.filename}`);
        changed = true; missing++;
        return { ...item, imageUrl: expected };
      });

      if (changed) {
        if (!DRY_RUN) {
          await supabase.from("activities").update({ content: { ...act.content, items: updated } }).eq("activity_id", act.activity_id);
        }
        fixed++;
      }
    }
  }

  console.log(`\n📊 ${ok} ok | ${missing} fixed | ${fixed} activities ${DRY_RUN ? "(dry run)" : "updated"}`);
}

function parseCSV(line: string): string[] | null {
  const p: string[] = []; let c = "", q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if (ch === "," && !q) { p.push(c.trim()); c = ""; } else c += ch; }
  p.push(c.trim());
  return p.length >= 7 ? p : null;
}

main().catch(console.error);
