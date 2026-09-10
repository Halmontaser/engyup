/**
 * Assign `originalAudioSrc` on Supabase listening-comprehension activities.
 *
 * Rule:
 *   For every listening-comprehension activity whose title matches
 *   `/Course Audio \(Track/si` (e.g. "Course Audio (Track N)" or
 *   "Course Audio (Tracks N, M)"), look at every OTHER
 *   listening-comprehension activity in the same lesson. If that target
 *   has a non-empty `content.questions` array and its
 *   `content.originalAudioSrc` differs from the course-audio's original
 *   filename, assign the course-audio's original filename to it.
 *
 * Approach:
 *   - Load local `public/media/media_map.json`.
 *   - Build the set of cs-audio slugs (keys ending in `-cs-audio`) and the
 *     passage filename for each (the entry whose `audioType === "passage"`).
 *   - Walk Supabase courses -> modules -> lessons to compute each lesson's
 *     cs-audio slug as `g{grade}-{unit}.{lesson}-cs-audio` using
 *     `order_index` directly (the data is 1-based, matching the existing
 *     media_map slugs; e.g. g10-1.10-cs-audio).
 *   - Fetch all listening-comprehension activities for those lessons,
 *     sorted by `order_index` per lesson.
 *   - For each lesson, find any course-audio activity (broader regex),
 *     resolve its slug against media_map, and prepare an update for every
 *     other listening-comp activity whose `content.questions` is a
 *     non-empty array and whose existing `originalAudioSrc` differs.
 *
 * Usage:
 *   npx tsx scripts/assign-original-audio.ts --dry-run   # preview only
 *   npx tsx scripts/assign-original-audio.ts             # apply updates
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 50;
const MEDIA_MAP_PATH = "public/media/media_map.json";

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
interface MediaMapEntry {
  audio: Array<{
    filename: string;
    url: string;
    audioType?: string;
    text?: string;
    idx?: number;
  }>;
  images?: any[];
}

interface CourseRow {
  id: string;
  title: string;
}

interface ModuleRow {
  id: string;
  course_id: string;
  order_index: number | null;
}

interface LessonRow {
  id: string;
  module_id: string;
  order_index: number | null;
  title: string | null;
}

interface ActivityRow {
  activity_id: string;
  lesson_id: string;
  activity_type: string;
  title: string | null;
  order_index: number | null;
  content: any;
}

interface PlannedUpdate {
  activity_id: string;
  lesson_id: string;
  title: string | null;
  existingOriginalAudioSrc: string | undefined;
  originalAudioSrc: string;
}

interface LessonInfo {
  lessonId: string;
  grade: number;
  unit: number;
  lesson: number;
  slug: string;
}

interface LessonAudit {
  lessonId: string;
  slug: string;
  courseAudioCount: number;
  questionTargetCount: number;
  filename: string | null;
}

// ── Media map helpers ──────────────────────────────────────────────────────
function loadMediaMap(): Record<string, MediaMapEntry> {
  const abs = path.resolve(process.cwd(), MEDIA_MAP_PATH);
  if (!fs.existsSync(abs)) {
    throw new Error(`media_map.json not found at ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf-8")) as Record<string, MediaMapEntry>;
}

function buildCsAudioIndex(
  mediaMap: Record<string, MediaMapEntry>
): Map<string, string> {
  const idx = new Map<string, string>();
  for (const [slug, entry] of Object.entries(mediaMap)) {
    if (!slug.endsWith("-cs-audio")) continue;
    if (!entry || !Array.isArray(entry.audio)) continue;
    const passage = entry.audio.find((a) => a.audioType === "passage");
    if (!passage || typeof passage.filename !== "string") continue;
    idx.set(slug, passage.filename);
  }
  return idx;
}

// ── DB helpers (paginated) ─────────────────────────────────────────────────
async function fetchAllCourses(): Promise<CourseRow[]> {
  const rows: CourseRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("courses")
      .select("id, title")
      .ilike("title", "Grade %")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`courses fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as CourseRow[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

async function fetchModulesForCourses(
  courseIds: string[]
): Promise<ModuleRow[]> {
  if (courseIds.length === 0) return [];
  const rows: ModuleRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("modules")
      .select("id, course_id, order_index")
      .in("course_id", courseIds)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`modules fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as ModuleRow[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

async function fetchLessonsForModules(
  moduleIds: string[]
): Promise<LessonRow[]> {
  if (moduleIds.length === 0) return [];
  const rows: LessonRow[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, module_id, order_index, title")
      .in("module_id", moduleIds)
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`lessons fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as LessonRow[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

const ACTIVITY_ID_CHUNK = 100; // Supabase URL length: cap lesson_ids per query

async function fetchListeningActivitiesForLessons(
  lessonIds: string[]
): Promise<ActivityRow[]> {
  if (lessonIds.length === 0) return [];
  const rows: ActivityRow[] = [];
  const PAGE = 1000;
  for (let i = 0; i < lessonIds.length; i += ACTIVITY_ID_CHUNK) {
    const chunk = lessonIds.slice(i, i + ACTIVITY_ID_CHUNK);
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from("activities")
        .select("activity_id, lesson_id, activity_type, title, order_index, content")
        .eq("activity_type", "listening-comprehension")
        .in("lesson_id", chunk)
        .order("lesson_id", { ascending: true })
        .order("order_index", { ascending: true })
        .range(offset, offset + PAGE - 1);
      if (error) throw new Error(`activities fetch failed: ${error.message}`);
      if (!data || data.length === 0) break;
      rows.push(...(data as ActivityRow[]));
      offset += data.length;
      if (data.length < PAGE) break;
    }
  }
  return rows;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const COURSE_AUDIO_RE = /Course Audio \(Track/si;

function isCourseAudioActivity(a: ActivityRow): boolean {
  return typeof a.title === "string" && COURSE_AUDIO_RE.test(a.title.trim());
}

function getQuestionsCount(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  const questions = (content as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) return 0;
  return questions.length;
}

function getOriginalAudioSrc(content: unknown): string | undefined {
  if (!content || typeof content !== "object") return undefined;
  const v = (content as { originalAudioSrc?: unknown }).originalAudioSrc;
  return typeof v === "string" ? v : undefined;
}

function parseGradeFromTitle(title: string): number | null {
  const m = title.match(/Grade\s+(\d+)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function buildSlug(grade: number, unit: number, lesson: number): string {
  return `g${grade}-${unit}.${lesson}-cs-audio`;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(
    DRY_RUN
      ? "[assign-original-audio] DRY-RUN — no Supabase updates."
      : "[assign-original-audio] LIVE — will write to Supabase."
  );

  // 1) Load media map
  console.log(`[1] Loading ${MEDIA_MAP_PATH}...`);
  const mediaMap = loadMediaMap();
  const csAudioIndex = buildCsAudioIndex(mediaMap);
  console.log(`    cs-audio slugs available in media map: ${csAudioIndex.size}`);

  // 2) Fetch courses
  console.log("[2] Fetching English grade courses...");
  const courses = await fetchAllCourses();
  console.log(`    Found ${courses.length} courses:`);
  const courseGrade = new Map<string, number>();
  for (const c of courses) {
    const g = parseGradeFromTitle(c.title);
    if (g !== null) courseGrade.set(c.id, g);
    console.log(`      - ${c.title} (id=${c.id})`);
  }
  if (courseGrade.size === 0) {
    console.log("No English grade courses found. Exiting.");
    return;
  }
  const courseIds = Array.from(courseGrade.keys());

  // 3) Fetch modules
  console.log("[3] Fetching modules...");
  const modules = await fetchModulesForCourses(courseIds);
  const moduleInfo = new Map<string, { course_id: string; order_index: number }>();
  for (const m of modules) {
    if (m.order_index == null) continue;
    moduleInfo.set(m.id, { course_id: m.course_id, order_index: m.order_index });
  }
  console.log(`    modules with order_index: ${moduleInfo.size}`);

  // 4) Fetch lessons
  console.log("[4] Fetching lessons...");
  const lessons = await fetchLessonsForModules(Array.from(moduleInfo.keys()));
  const lessonInfoByLessonId = new Map<string, LessonInfo>();
  for (const l of lessons) {
    const mod = moduleInfo.get(l.module_id);
    if (!mod || l.order_index == null) continue;
    const grade = courseGrade.get(mod.course_id);
    if (grade == null) continue;
    lessonInfoByLessonId.set(l.id, {
      lessonId: l.id,
      grade,
      unit: mod.order_index,
      lesson: l.order_index,
      slug: buildSlug(grade, mod.order_index, l.order_index),
    });
  }
  console.log(`    lessons resolved: ${lessonInfoByLessonId.size}`);

  // 5) Fetch listening activities for ALL English lessons
  console.log("[5] Fetching listening-comprehension activities for all English lessons...");
  const activities = await fetchListeningActivitiesForLessons(
    Array.from(lessonInfoByLessonId.keys())
  );
  console.log(`    activities fetched: ${activities.length}`);

  // Group activities by lesson, sorted by order_index (server already sorts,
  // but sort again locally to be defensive).
  const activitiesByLesson = new Map<string, ActivityRow[]>();
  for (const a of activities) {
    if (!a.lesson_id) continue;
    const list = activitiesByLesson.get(a.lesson_id) ?? [];
    list.push(a);
    activitiesByLesson.set(a.lesson_id, list);
  }
  for (const list of activitiesByLesson.values()) {
    list.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  // 6) Build planned updates
  console.log("[6] Planning updates...");
  const planned: PlannedUpdate[] = [];
  let totalCourseAudios = 0;
  const missingSlugAudits: Array<{ slug: string; lessonId: string; title: string | null }> = [];
  const lessonsWithAudioButNoQuestions: Array<{ lessonId: string; slug: string }> = [];
  const lessonAudits: LessonAudit[] = [];

  for (const [lessonId, info] of lessonInfoByLessonId) {
    const group = activitiesByLesson.get(lessonId) ?? [];
    const courseAudios = group.filter(isCourseAudioActivity);
    if (courseAudios.length === 0) continue;

    totalCourseAudios += courseAudios.length;
    const filename = csAudioIndex.get(info.slug) ?? null;

    if (filename === null) {
      // Log every course-audio activity whose slug is missing from media_map
      for (const ca of courseAudios) {
        missingSlugAudits.push({
          slug: info.slug,
          lessonId,
          title: ca.title ?? null,
        });
      }
      lessonAudits.push({
        lessonId,
        slug: info.slug,
        courseAudioCount: courseAudios.length,
        questionTargetCount: 0,
        filename: null,
      });
      continue;
    }

    const courseAudioIds = new Set(courseAudios.map((a) => a.activity_id));
    const targets = group.filter(
      (a) =>
        !courseAudioIds.has(a.activity_id) && getQuestionsCount(a.content) > 0
    );

    lessonAudits.push({
      lessonId,
      slug: info.slug,
      courseAudioCount: courseAudios.length,
      questionTargetCount: targets.length,
      filename,
    });

    if (targets.length === 0) {
      lessonsWithAudioButNoQuestions.push({ lessonId, slug: info.slug });
      continue;
    }

    for (const target of targets) {
      const existing = getOriginalAudioSrc(target.content);
      if (existing === filename) continue;
      planned.push({
        activity_id: target.activity_id,
        lesson_id: target.lesson_id,
        title: target.title ?? null,
        existingOriginalAudioSrc: existing,
        originalAudioSrc: filename,
      });
    }
  }

  const alreadyCorrect = lessonAudits.reduce((sum, a) => {
    if (a.filename === null) return sum;
    const group = activitiesByLesson.get(a.lessonId) ?? [];
    const courseAudioIds = new Set(
      group.filter(isCourseAudioActivity).map((x) => x.activity_id)
    );
    const targets = group.filter(
      (x) =>
        !courseAudioIds.has(x.activity_id) && getQuestionsCount(x.content) > 0
    );
    let n = 0;
    for (const t of targets) {
      if (getOriginalAudioSrc(t.content) === a.filename) n++;
    }
    return sum + n;
  }, 0);

  console.log(`\n── Summary ──`);
  console.log(`Total course-audio activities found: ${totalCourseAudios}`);
  console.log(`Course-audio activities with no media_map entry: ${missingSlugAudits.length}`);
  console.log(`Lessons with course-audio but zero question-activities: ${lessonsWithAudioButNoQuestions.length}`);
  console.log(`Target activities already correct (no change needed): ${alreadyCorrect}`);
  console.log(`Planned updates: ${planned.length}`);

  if (missingSlugAudits.length > 0) {
    const sample = missingSlugAudits.slice(0, 20);
    console.log(
      `\nCourse-audio with no media_map entry (first ${sample.length} of ${missingSlugAudits.length}):`
    );
    for (const m of sample) {
      console.log(`  - slug=${m.slug} | lesson=${m.lessonId} | title="${m.title ?? ""}"`);
    }
  }

  if (lessonsWithAudioButNoQuestions.length > 0) {
    const sample = lessonsWithAudioButNoQuestions.slice(0, 20);
    console.log(
      `\nLessons with course-audio but no question-activities (first ${sample.length} of ${lessonsWithAudioButNoQuestions.length}):`
    );
    for (const l of sample) {
      console.log(`  - slug=${l.slug} | lesson=${l.lessonId}`);
    }
  }

  if (planned.length === 0) {
    console.log("\nNothing to update.");
    return;
  }

  // 7) Preview first 20
  const previewCount = Math.min(20, planned.length);
  console.log(`\nPreview (first ${previewCount} of ${planned.length}):`);
  for (let i = 0; i < previewCount; i++) {
    const u = planned[i];
    console.log(
      `  ${i + 1}. activity=${u.activity_id} | lesson=${u.lesson_id} | title="${u.title ?? ""}" | existing="${u.existingOriginalAudioSrc ?? ""}" -> "${u.originalAudioSrc}"`
    );
  }

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] Skipping Supabase updates.");
    return;
  }

  // 8) Apply in batches
  console.log(`\nApplying ${planned.length} updates in batches of ${BATCH_SIZE}...`);
  let applied = 0;
  let failed = 0;

  for (let i = 0; i < planned.length; i += BATCH_SIZE) {
    const batch = planned.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (u) => {
        const { data: row, error: fetchErr } = await supabase
          .from("activities")
          .select("content")
          .eq("activity_id", u.activity_id)
          .single();

        if (fetchErr || !row) {
          return {
            ok: false as const,
            activity_id: u.activity_id,
            error: fetchErr?.message ?? "row not found",
          };
        }

        const baseContent =
          row.content && typeof row.content === "object" ? row.content : {};
        const newContent = { ...baseContent, originalAudioSrc: u.originalAudioSrc };

        const { error: updateErr } = await supabase
          .from("activities")
          .update({ content: newContent })
          .eq("activity_id", u.activity_id);

        if (updateErr) {
          return {
            ok: false as const,
            activity_id: u.activity_id,
            error: updateErr.message,
          };
        }
        return { ok: true as const, activity_id: u.activity_id };
      })
    );

    let batchOk = 0;
    let batchFail = 0;
    for (const r of batchResults) {
      if (r.ok) batchOk++;
      else {
        batchFail++;
        console.error(`  FAILED ${r.activity_id}: ${r.error}`);
      }
    }
    applied += batchOk;
    failed += batchFail;
    console.log(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchOk} ok, ${batchFail} failed (running total applied=${applied})`
    );
  }

  console.log(`\nDone. Applied: ${applied}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("[assign-original-audio] script failed:", err);
  process.exit(1);
});
