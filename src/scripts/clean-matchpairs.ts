/**
 * Clean match-pairs data: remove imgUrl/audioUrl from pair items.
 * Keeps only: left, right, leftImage, rightImage, leftAudio, rightAudio
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

const VALID_KEYS = new Set(["left", "right", "leftImage", "rightImage", "leftAudio", "rightAudio"]);

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

    let changed = false;
    const fixed = pairs.map((p: any) => {
      const clean: any = {};
      for (const key of VALID_KEYS) {
        if (p[key] !== undefined && p[key] !== null && p[key] !== "") {
          clean[key] = p[key];
        }
      }
      // Only mark changed if we dropped keys
      if (Object.keys(p).length !== Object.keys(clean).length) changed = true;
      return clean;
    });

    if (!changed) continue;

    const dropped = pairs[0] ? Object.keys(pairs[0]).filter(k => !VALID_KEYS.has(k)) : [];

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from("activities")
        .update({ content: { ...act.content, pairs: fixed } })
        .eq("activity_id", act.activity_id);
      if (upErr) console.log(`  ❌ ${act.activity_id}: ${upErr.message}`);
      else console.log(`  ✅ ${act.title || act.activity_id} — removed: ${dropped.join(", ")}`);
    } else {
      console.log(`  [DRY RUN] ${act.title || act.activity_id} — would remove: ${dropped.join(", ")}`);
    }
    cleaned++;
  }

  console.log(`\n✅ ${cleaned} match-pairs activities cleaned${DRY_RUN ? " (dry run)" : ""}`);
}

main().catch(console.error);
