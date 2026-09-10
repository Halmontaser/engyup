/**
 * Test script for reorder_activity and reorder_lesson DB functions.
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJh..."
 *   npx tsx scripts/test-reorder-functions.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_KEY) {
  console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: "public" },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let testModuleId: string;
let testLessons: string[] = [];
let testActivities: string[] = [];
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

async function sql(query: string) {
  const { error } = await supabase.rpc("__raw_sql", { query } as any).maybeSingle();
  // rpc approach varies; use direct .from() calls where possible
}

async function sqlRaw(query: string) {
  // Supabase JS client doesn't expose raw SQL — use REST rpc or management API.
  // For testing, we'll use supabase.from() calls wherever possible.
  // For CREATE OR REPLACE FUNCTION, we can use the REST API's /rpc endpoint
  // if an arbitrary SQL runner RPC exists, or we prompt the user to run the
  // migration first.
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL error: ${text}`);
  }
  return res;
}

// ---------------------------------------------------------------------------
// Setup: create test module + 2 lessons + 5 activities per lesson
// ---------------------------------------------------------------------------

async function setup() {
  console.log("\n🔧 Setting up test data...\n");

  // Create test module
  const { data: mod, error: modErr } = await supabase
    .from("modules")
    .insert({
      title: "__TEST_REORDER_MODULE__",
      order_index: 9999,
      course_id: "00000000-0000-0000-0000-000000000000", // dummy
    })
    .select("id")
    .single();

  if (modErr) {
    // Module might not have a course_id FK, try without
    const { data: mod2, error: modErr2 } = await supabase
      .from("modules")
      .insert({ title: "__TEST_REORDER_MODULE__", order_index: 9999 })
      .select("id")
      .single();

    if (modErr2) {
      console.error("❌ Could not create test module:", modErr2.message);
      console.error("   Make sure the modules table exists and you have write access.");
      process.exit(1);
    }
    testModuleId = mod2!.id;
  } else {
    testModuleId = mod!.id;
  }
  console.log(`  Module: ${testModuleId}`);

  // Create 2 test lessons
  for (let i = 0; i < 2; i++) {
    const { data: lesson, error: lErr } = await supabase
      .from("lessons")
      .insert({
        module_id: testModuleId,
        title: `__TEST_LESSON_${i}__`,
        order_index: i,
      })
      .select("id")
      .single();

    if (lErr) {
      console.error("❌ Could not create test lesson:", lErr.message);
      await cleanup();
      process.exit(1);
    }
    testLessons.push(lesson!.id);
    console.log(`  Lesson ${i}: ${lesson!.id}`);

    // Create 5 activities per lesson
    for (let j = 0; j < 5; j++) {
      const { data: act, error: aErr } = await supabase
        .from("activities")
        .insert({
          lesson_id: lesson!.id,
          activity_type: "mcq",
          title: `__TEST_ACT_${i}_${j}__`,
          order_index: j,
          content: {},
          is_required: false,
          xp_reward: 10,
        })
        .select("activity_id")
        .single();

      if (aErr) {
        console.error("❌ Could not create test activity:", aErr.message);
        await cleanup();
        process.exit(1);
      }
      testActivities.push(act!.activity_id);
    }
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

async function getActivityOrder(lessonIdx: number): Promise<{ id: string; order_index: number; title: string }[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("activity_id, order_index, title")
    .eq("lesson_id", testLessons[lessonIdx])
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.activity_id,
    order_index: a.order_index,
    title: a.title,
  }));
}

async function getLessonOrder(): Promise<{ id: string; order_index: number; title: string }[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, order_index, title")
    .eq("module_id", testModuleId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data || []).map((l: any) => ({
    id: l.id,
    order_index: l.order_index,
    title: l.title,
  }));
}

async function callReorderActivity(activityId: string, newIndex: number, newLessonId?: string) {
  const { error } = await supabase.rpc("reorder_activity", {
    p_activity_id: activityId,
    p_new_order_index: newIndex,
    p_new_lesson_id: newLessonId || null,
  });
  if (error) throw error;
}

async function callReorderLesson(lessonId: string, newIndex: number, newModuleId?: string) {
  const { error } = await supabase.rpc("reorder_lesson", {
    p_lesson_id: lessonId,
    p_new_order_index: newIndex,
    p_new_module_id: newModuleId || null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

async function testActivitySameLessonMoveDown() {
  console.log("\n📋 TEST: Move activity 0 → 2 within same lesson (shift down)");

  // Initial: 0,1,2,3,4
  // Move act_0 (idx=0) to idx=2
  // Expected: act_1→0, act_2→1, act_0→2, act_3→3, act_4→4
  const target = testActivities[0]; // act_0_0 at order_index 0
  await callReorderActivity(target, 2);

  const order = await getActivityOrder(0);
  assert(order[0].order_index === 0 && order[0].title === "__TEST_ACT_0_1__", "old idx 1 now at 0");
  assert(order[1].order_index === 1 && order[1].title === "__TEST_ACT_0_2__", "old idx 2 now at 1");
  assert(order[2].order_index === 2 && order[2].title === "__TEST_ACT_0_0__", "moved activity at target 2");
  assert(order[3].order_index === 3 && order[3].title === "__TEST_ACT_0_3__", "idx 3 unchanged");
  assert(order[4].order_index === 4 && order[4].title === "__TEST_ACT_0_4__", "idx 4 unchanged");

  // Restore
  await callReorderActivity(order[2].id, 0);
}

async function testActivitySameLessonMoveUp() {
  console.log("\n📋 TEST: Move activity 4 → 1 within same lesson (shift up)");

  // After restore: 0,1,2,3,4
  // Move act_0_4 (idx=4) to idx=1
  // Expected: act_0→0, act_4→1, act_1→2, act_2→3, act_3→4
  const target = testActivities[4]; // act_0_4 at order_index 4
  await callReorderActivity(target, 1);

  const order = await getActivityOrder(0);
  assert(order[0].order_index === 0, "idx 0 unchanged");
  assert(order[1].order_index === 1 && order[1].title === "__TEST_ACT_0_4__", "moved activity at target 1");
  assert(order[2].order_index === 2 && order[2].title === "__TEST_ACT_0_1__", "old idx 1 shifted to 2");
  assert(order[3].order_index === 3 && order[3].title === "__TEST_ACT_0_2__", "old idx 2 shifted to 3");
  assert(order[4].order_index === 4 && order[4].title === "__TEST_ACT_0_3__", "old idx 3 shifted to 4");

  // Restore
  await callReorderActivity(order[1].id, 4);
}

async function testActivityCrossLesson() {
  console.log("\n📋 TEST: Move activity from lesson 0 to lesson 1");

  // Move act_0_4 (idx=4 in lesson 0) to idx=2 in lesson 1
  const target = testActivities[4]; // act_0_4
  await callReorderActivity(target, 2, testLessons[1]);

  // Lesson 0 should now have 4 activities: 0,1,2,3 (gap closed)
  const order0 = await getActivityOrder(0);
  assert(order0.length === 4, "lesson 0 now has 4 activities");
  assert(order0[3].order_index === 3, "last activity has order_index 3 (no gap)");

  // Lesson 1 should now have 6 activities
  // Original: 0,1,2,3,4 → after insert at 2: 0,1,moved,3,4,5
  const order1 = await getActivityOrder(1);
  assert(order1.length === 6, "lesson 1 now has 6 activities");
  assert(order1[2].order_index === 2 && order1[2].title === "__TEST_ACT_0_4__", "moved activity at idx 2 in lesson 1");
  assert(order1[3].order_index === 3 && order1[3].title === "__TEST_ACT_1_2__", "old idx 2 shifted to 3");
  assert(order1[4].order_index === 4 && order1[4].title === "__TEST_ACT_1_3__", "old idx 3 shifted to 4");
  assert(order1[5].order_index === 5 && order1[5].title === "__TEST_ACT_1_4__", "old idx 4 shifted to 5");

  // Move it back
  await callReorderActivity(target, 4, testLessons[0]);
  const restored0 = await getActivityOrder(0);
  assert(restored0.length === 5, "lesson 0 restored to 5 activities");
  const restored1 = await getActivityOrder(1);
  assert(restored1.length === 5, "lesson 1 restored to 5 activities");
}

async function testLessonSameModuleMoveUp() {
  console.log("\n📋 TEST: Move lesson 1 → 0 within same module");

  await callReorderLesson(testLessons[1], 0);

  const order = await getLessonOrder();
  const testLessons_ = order.filter((l) => testLessons.includes(l.id));
  assert(testLessons_[0].id === testLessons[1] && testLessons_[0].order_index === 0, "lesson 1 now at index 0");
  assert(testLessons_[1].id === testLessons[0] && testLessons_[1].order_index === 1, "lesson 0 shifted to index 1");

  // Restore
  await callReorderLesson(testLessons[1], 1);
}

async function testNoOp() {
  console.log("\n📋 TEST: No-op (same position) should not error");

  await callReorderActivity(testActivities[0], 0); // already at 0
  // If we get here without error, it passed
  assert(true, "no-op reorder did not throw");
}

async function testNotFound() {
  console.log("\n📋 TEST: Non-existent activity should raise error");

  try {
    await callReorderActivity("00000000-0000-0000-0000-000000000000", 0);
    assert(false, "should have thrown");
  } catch (e: any) {
    assert(e.message.includes("not found"), `throws "not found": ${e.message}`);
  }
}

async function testNegativeIndexClamped() {
  console.log("\n📋 TEST: Negative index clamped to 0");

  // Move act_0 (idx=0) to -5 → should end up at 0 (move to top, same as no-op here)
  await callReorderActivity(testActivities[0], -5);
  const order = await getActivityOrder(0);
  assert(order[0].id === testActivities[0] && order[0].order_index === 0, "negative index clamped, activity at 0");

  // Move act_4 (idx=4) to -5 → should end up at 0
  await callReorderActivity(testActivities[4], -5);
  const order2 = await getActivityOrder(0);
  assert(order2[0].id === testActivities[4] && order2[0].order_index === 0, "act_4 moved to top with negative index");

  // Restore
  await callReorderActivity(testActivities[4], 4);
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");

  // Delete all test activities
  for (const id of testActivities) {
    await supabase.from("activities").delete().eq("activity_id", id);
  }

  // Delete test lessons
  for (const id of testLessons) {
    await supabase.from("lessons").delete().eq("id", id);
  }

  // Delete test module
  if (testModuleId) {
    await supabase.from("modules").delete().eq("id", testModuleId);
  }

  console.log("  Done.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🧪 Testing reorder_activity & reorder_lesson\n");
  console.log("=" .repeat(50));

  // First, ensure the functions are deployed
  console.log("\n📌 Ensure the migration is deployed (supabase/migrations/0001_reorder_functions.sql)");
  console.log("   If functions don't exist, tests will fail with 'function not found'.\n");

  await setup();

  try {
    await testActivitySameLessonMoveDown();
    await testActivitySameLessonMoveUp();
    await testActivityCrossLesson();
    await testLessonSameModuleMoveUp();
    await testNoOp();
    await testNotFound();
    await testNegativeIndexClamped();
  } finally {
    await cleanup();
  }

  console.log("\n" + "=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error("❌", e.message || e);
  await cleanup();
  process.exit(1);
});
