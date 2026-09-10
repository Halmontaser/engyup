/**
 * Reorder activities so listening-comprehension is first in every lesson,
 * across ALL courses. Uses the reorder_activity DB function for atomicity.
 *
 * Logic:
 *   1. Find the first activity (lowest order_index) in the lesson
 *   2. Find the listening-comprehension activity in the same lesson
 *   3. Move listening-comprehension to the first activity's order_index
 *
 * The reorder_activity function handles sibling shifting automatically.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJh..."
 *   npx tsx scripts/reorder-listening-first.ts --dry-run
 *   npx tsx scripts/reorder-listening-first.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Paginated fetch — no 1000-row limit
// ---------------------------------------------------------------------------
async function fetchAllActivities() {
  const PAGE_SIZE = 1000;
  const all: any[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, lesson_id, activity_type, order_index, title")
      .order("order_index", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

async function main() {
  console.log("🔍 Fetching all activities (paginated)...");
  const activities = await fetchAllActivities();
  console.log(`   ${activities.length} activities loaded\n`);

  // ------------------------------------------------------------------
  // 1. Determine the first activity (lowest order_index) per lesson
  // ------------------------------------------------------------------
  const firstPerLesson = new Map<string, { id: string; order_index: number }>();
  for (const a of activities) {
    const existing = firstPerLesson.get(a.lesson_id);
    if (!existing || a.order_index < existing.order_index) {
      firstPerLesson.set(a.lesson_id, { id: a.activity_id, order_index: a.order_index });
    }
  }

  // ------------------------------------------------------------------
  // 2. Find listening-comprehension activities grouped by lesson
  // ------------------------------------------------------------------
  const lcByLesson = new Map<string, any[]>();
  for (const a of activities) {
    if (a.activity_type !== "listening-comprehension") continue;
    if (!lcByLesson.has(a.lesson_id)) lcByLesson.set(a.lesson_id, []);
    lcByLesson.get(a.lesson_id)!.push(a);
  }

  // ------------------------------------------------------------------
  // 3. For each lesson with a listening-comprehension activity, move it
  //    to the position of the first activity in that lesson.
  // ------------------------------------------------------------------
  let moved = 0;
  let skippedNoLesson = 0;
  let skippedAlreadyFirst = 0;

  for (const [lessonId, lcActs] of lcByLesson) {
    const first = firstPerLesson.get(lessonId);
    if (!first) {
      skippedNoLesson++;
      continue; // no activities found for this lesson? shouldn't happen
    }

    for (const lc of lcActs) {
      // Already at the first position? Skip.
      if (lc.order_index === first.order_index) {
        skippedAlreadyFirst++;
        continue;
      }

      console.log(
        `📋 Lesson ${lessonId}: ` +
        `"${lc.title || lc.activity_id}" ` +
        `(listening-comprehension, idx ${lc.order_index}) ` +
        `→ position ${first.order_index} ` +
        `(was "${first.id}")`
      );

      if (!DRY_RUN) {
        const { error } = await supabase.rpc("reorder_activity", {
          p_activity_id: lc.activity_id,
          p_new_order_index: first.order_index,
        });

        if (error) {
          console.error(`   ❌ Failed: ${error.message}`);
        } else {
          moved++;
        }
      } else {
        moved++;
      }
    }
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log(`\n---`);
  console.log(`Lessons with listening-comprehension: ${lcByLesson.size}`);
  console.log(`Already at first position:              ${skippedAlreadyFirst}`);
  console.log(`Moved ${DRY_RUN ? "(would move)" : ""}:              ${moved}`);
  if (skippedNoLesson > 0) console.log(`Skipped (no lesson data):               ${skippedNoLesson}`);
  console.log(`${DRY_RUN ? "\n⚠️  Dry run — no changes applied. Re-run without --dry-run to execute." : ""}`);
  console.log(`\n✅ Done.`);
}

main().catch((e) => {
  console.error("❌", e.message || e);
  process.exit(1);
});
