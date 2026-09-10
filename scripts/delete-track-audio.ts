/**
 * Delete listening-comprehension placeholder activities whose title contains
 * the word "Track" and which have no `content.questions`. These were the
 * course-audio placeholder activities that have been superseded now that the
 * real listening-comp activities carry `originalAudioSrc`.
 *
 * Match criteria (ALL three must hold):
 *   - activity_type = 'listening-comprehension'
 *   - title ILIKE '%Track%'   (case-insensitive substring match)
 *   - content.questions is missing, null, or an empty array
 *
 * Usage:
 *   npx tsx scripts/delete-track-audio.ts --dry-run   # preview only
 *   npx tsx scripts/delete-track-audio.ts             # live delete
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;
const PAUSE_MS = 3000;

// ── Env loading ────────────────────────────────────────────────────────────
function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) return;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Types ──────────────────────────────────────────────────────────────────
interface ActivityRow {
  activity_id: string;
  lesson_id: string;
  title: string | null;
  order_index: number | null;
  content: unknown;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hasNoQuestions(content: unknown): boolean {
  if (!content || typeof content !== "object") return true;
  const questions = (content as { questions?: unknown }).questions;
  if (questions == null) return true;
  if (!Array.isArray(questions)) return true;
  return questions.length === 0;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(
    DRY_RUN
      ? "[delete-track-audio] DRY-RUN — no Supabase deletes will be performed."
      : "[delete-track-audio] LIVE — will DELETE rows from `activities`."
  );

  // 1) Fetch candidate rows (server-side filter on activity_type + title)
  console.log(
    "[1] Fetching listening-comprehension activities whose title contains 'Track'..."
  );
  const PAGE = 1000;
  const rows: ActivityRow[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, lesson_id, title, order_index, content")
      .eq("activity_type", "listening-comprehension")
      .ilike("title", "%Track%")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`activities fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as ActivityRow[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  console.log(`    rows fetched from Supabase: ${rows.length}`);

  // 2) Apply client-side filter for empty/missing questions
  const targets = rows.filter((r) => hasNoQuestions(r.content));
  console.log(`    rows matching ALL three criteria: ${targets.length}`);

  if (targets.length === 0) {
    console.log("\nNothing to delete. Exiting.");
    return;
  }

  // 3) Dry-run preview / live summary
  const previewCount = Math.min(30, targets.length);
  console.log(
    `\nPreview (first ${previewCount} of ${targets.length} rows that would be deleted):`
  );
  for (let i = 0; i < previewCount; i++) {
    const t = targets[i];
    console.log(
      `  ${i + 1}. activity_id=${t.activity_id} | lesson_id=${t.lesson_id} | order_index=${
        t.order_index ?? ""
      } | title="${t.title ?? ""}"`
    );
  }

  if (DRY_RUN) {
    console.log(
      `\n[DRY-RUN] ${targets.length} activities would be deleted. No changes made.`
    );
    return;
  }

  // 4) Live delete with 3-second warning pause
  console.log(
    `\n[!] About to DELETE ${targets.length} activities from Supabase.`
  );
  console.log(
    `[!] Pausing ${PAUSE_MS / 1000}s before proceeding — Ctrl-C to abort.`
  );
  await sleep(PAUSE_MS);

  console.log(
    `\nApplying deletes in batches of ${BATCH_SIZE}...`
  );
  let deleted = 0;
  let failed = 0;
  const failedBatches: Array<{ batch: number; error: string }> = [];

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchIds = batch.map((t) => t.activity_id);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(targets.length / BATCH_SIZE);

    const { error } = await supabase
      .from("activities")
      .delete()
      .in("activity_id", batchIds);

    if (error) {
      failed += batchIds.length;
      failedBatches.push({ batch: batchNum, error: error.message });
      console.error(
        `  Batch ${batchNum}/${totalBatches}: FAILED (${batchIds.length} rows) — ${error.message}`
      );
      continue;
    }
    deleted += batchIds.length;
    console.log(
      `  Batch ${batchNum}/${totalBatches}: ok (${batchIds.length} deleted; running total=${deleted})`
    );
  }

  console.log(`\nDone. Deleted: ${deleted}, Failed: ${failed}`);
  if (failedBatches.length > 0) {
    console.log(`Failed batches:`);
    for (const fb of failedBatches) {
      console.log(`  - batch #${fb.batch}: ${fb.error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[delete-track-audio] script failed:", err);
  process.exit(1);
});
