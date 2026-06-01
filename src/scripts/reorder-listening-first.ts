/**
 * Reorder activities so listening-comprehension is first in each lesson.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJh..."
 *   npx tsx src/scripts/reorder-listening-first.ts --dry-run
 *   npx tsx src/scripts/reorder-listening-first.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  // Get all activities grouped by lesson
  const { data: activities, error } = await supabase
    .from("activities")
    .select("activity_id, lesson_id, activity_type, order_index, title")
    .order("order_index", { ascending: true })
    .limit(1000);

  if (error) { console.error("❌", error.message); process.exit(1); }

  // Group by lesson
  const byLesson = new Map<string, any[]>();
  for (const a of activities as any[]) {
    if (!byLesson.has(a.lesson_id)) byLesson.set(a.lesson_id, []);
    byLesson.get(a.lesson_id)!.push(a);
  }

  let moved = 0;

  for (const [lessonId, acts] of byLesson) {
    // Find listening-comprehension activity
    const lcIdx = acts.findIndex((a: any) => a.activity_type === "listening-comprehension");
    if (lcIdx <= 0) continue; // already first or not present

    const lc = acts[lcIdx];
    const others = acts.filter((_: any, i: number) => i !== lcIdx);

    console.log(`\n📋 Lesson ${lessonId}: moving "${lc.title || lc.activity_id}" to position 0 (was ${lc.order_index})`);

    if (!DRY_RUN) {
      // Set listening-comprehension to order 0
      await supabase.from("activities").update({ order_index: 0 }).eq("activity_id", lc.activity_id);
      // Shift others up by 1
      for (let i = 0; i < others.length; i++) {
        await supabase.from("activities").update({ order_index: i + 1 }).eq("activity_id", others[i].activity_id);
      }
    }

    moved++;
  }

  console.log(`\n✅ ${moved} lessons reordered${DRY_RUN ? " (dry run)" : ""}`);
}

main().catch(console.error);
