/**
 * Clean ALL match-pairs: strip image/audio fields, keep only text (left, right).
 *
 * Usage:
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJh..."
 *   npx tsx src/scripts/clean-matchpairs.ts --dry-run
 *   npx tsx src/scripts/clean-matchpairs.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://msttsebafjgzllyabsid.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_KEY) { console.error("❌ Set SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Strip everything except left/right text
const STRIP_KEYS = ["imgUrl", "audioUrl", "leftImage", "rightImage", "leftAudio", "rightAudio"];

async function main() {
  const { data: activities, error } = await supabase
    .from("activities")
    .select("activity_id, lesson_id, content, title")
    .eq("activity_type", "match-pairs")
    .limit(500);

  if (error) { console.error("❌", error.message); process.exit(1); }

  let cleaned = 0;

  for (const act of activities as any[]) {
    const pairs = act.content?.pairs;
    if (!Array.isArray(pairs)) continue;

    const fixed = pairs.map((p: any) => {
      const clean: any = {};
      if (p.left) clean.left = p.left;
      if (p.right) clean.right = p.right;
      return clean;
    });

    // Check if anything changed
    const before = JSON.stringify(pairs);
    const after = JSON.stringify(fixed);
    if (before === after) continue;

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from("activities")
        .update({ content: { ...act.content, pairs: fixed } })
        .eq("activity_id", act.activity_id);
      if (upErr) console.log(`  ❌ ${act.activity_id}: ${upErr.message}`);
      else console.log(`  ✅ ${act.title || act.activity_id}`);
    } else {
      console.log(`  [DRY RUN] ${act.title || act.activity_id}`);
    }
    cleaned++;
  }

  console.log(`\n✅ ${cleaned} match-pairs cleaned${DRY_RUN ? " (dry run)" : ""}`);
}

main().catch(console.error);
