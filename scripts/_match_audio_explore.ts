import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import fs from "fs";
import path from "path";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface DumpActivity {
  id: string;
  lesson_id: string;
  type: string;
  title: string;
  data?: string;
}

interface DumpLesson {
  id: string;
  title: string;
}

interface MediaAudioEntry {
  filename: string;
  url: string;
  audioType: string;
  idx?: number;
}

interface MediaMapEntry {
  audio: MediaAudioEntry[];
  images?: any[];
}

type LocalMapping = Map<string, string>; // "lesson_title|activity_title" -> filename

interface DbActivity {
  activity_id: string;
  lesson_id: string;
  title: string | null;
  content: any;
}

interface DbLesson {
  id: string;
  title: string;
}

function loadJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), rel), "utf8")) as T;
}

function buildLocalMapping(
  dumpActivities: DumpActivity[],
  dumpLessons: DumpLesson[],
  mediaMap: Record<string, MediaMapEntry>
): LocalMapping {
  const lessonTitleById = new Map<string, string>();
  for (const l of dumpLessons) lessonTitleById.set(l.id, l.title);

  // group activities by lesson
  const activitiesByLesson = new Map<string, DumpActivity[]>();
  for (const a of dumpActivities) {
    const list = activitiesByLesson.get(a.lesson_id) ?? [];
    list.push(a);
    activitiesByLesson.set(a.lesson_id, list);
  }

  const mapping: LocalMapping = new Map();
  let csAudiosFound = 0;
  let csAudiosSkipped = 0;

  for (const a of dumpActivities) {
    if (a.type !== "listening-comprehension") continue;
    if (!a.id.endsWith("-cs-audio")) continue;
    csAudiosFound++;

    const lesson = lessonTitleById.get(a.lesson_id);
    if (!lesson) {
      csAudiosSkipped++;
      continue;
    }

    const mediaEntry = mediaMap[a.id];
    if (!mediaEntry || !Array.isArray(mediaEntry.audio)) {
      csAudiosSkipped++;
      continue;
    }

    const passage = mediaEntry.audio.find((x) => x.audioType === "passage");
    if (!passage) {
      csAudiosSkipped++;
      continue;
    }

    const others = (activitiesByLesson.get(a.lesson_id) ?? []).filter(
      (x) => x.id !== a.id && x.type === "listening-comprehension"
    );

    for (const target of others) {
      const key = `${lesson}|${target.title}`;
      if (!mapping.has(key)) mapping.set(key, passage.filename);
    }
  }

  console.log(
    `[local] cs-audio activities seen: ${csAudiosFound}, skipped (no lesson/media): ${csAudiosSkipped}`
  );
  console.log(`[local] target mapping size: ${mapping.size}`);
  return mapping;
}

async function fetchAllListeningActivities(): Promise<DbActivity[]> {
  const rows: DbActivity[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("activities")
      .select("activity_id, lesson_id, title, content, activity_type")
      .eq("activity_type", "listening-comprehension")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`activities fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as DbActivity[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

async function fetchAllLessons(): Promise<DbLesson[]> {
  const rows: DbLesson[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("lessons")
      .select("id, title")
      .range(offset, offset + PAGE - 1);
    if (error) throw new Error(`lessons fetch failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...(data as DbLesson[]));
    offset += data.length;
    if (data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  console.log("[explore] Loading local dumps...");
  const dump = loadJson<{
    lessons: DumpLesson[];
    activities: DumpActivity[];
  }>("scripts/curriculum_dump.json");
  const mediaMap = loadJson<Record<string, MediaMapEntry>>(
    "public/media/media_map.json"
  );

  const mapping = buildLocalMapping(
    dump.activities,
    dump.lessons,
    mediaMap
  );

  console.log("[explore] Fetching listening-comprehension activities from Supabase...");
  const activities = await fetchAllListeningActivities();
  console.log(`[explore] total listening-comprehension activities: ${activities.length}`);

  console.log("[explore] Fetching lessons from Supabase...");
  const lessons = await fetchAllLessons();
  const lessonTitleById = new Map<string, string>();
  for (const l of lessons) lessonTitleById.set(l.id, l.title);
  console.log(`[explore] total lessons: ${lessons.length}`);

  const sampleMatches: Array<{
    activity_id: string;
    lesson_title: string;
    title: string;
    filename: string;
  }> = [];
  const sampleUnmatched: Array<{
    activity_id: string;
    lesson_id: string;
    title: string;
    lesson_title: string | null;
  }> = [];

  let matched = 0;
  let unmatched = 0;
  let skippedNoLessonTitle = 0;
  const matchedKeys = new Set<string>();
  const matchedFilenames = new Set<string>();

  for (const a of activities) {
    const lessonTitle = a.lesson_id ? lessonTitleById.get(a.lesson_id) : null;
    if (!lessonTitle) {
      skippedNoLessonTitle++;
      unmatched++;
      if (sampleUnmatched.length < 10) {
        sampleUnmatched.push({
          activity_id: a.activity_id,
          lesson_id: a.lesson_id,
          title: a.title ?? "",
          lesson_title: null,
        });
      }
      continue;
    }
    const title = a.title ?? "";
    const key = `${lessonTitle}|${title}`;
    const filename = mapping.get(key);
    if (filename) {
      matched++;
      matchedKeys.add(key);
      matchedFilenames.add(filename);
      if (sampleMatches.length < 10) {
        sampleMatches.push({
          activity_id: a.activity_id,
          lesson_title: lessonTitle,
          title,
          filename,
        });
      }
    } else {
      unmatched++;
      if (sampleUnmatched.length < 10) {
        sampleUnmatched.push({
          activity_id: a.activity_id,
          lesson_id: a.lesson_id,
          title,
          lesson_title: lessonTitle,
        });
      }
    }
  }

  const rate = activities.length === 0 ? 0 : (matched / activities.length) * 100;
  console.log(`\n[explore] === RESULTS ===`);
  console.log(`[explore] total supabase listening-comprehension activities: ${activities.length}`);
  console.log(`[explore] matched: ${matched}`);
  console.log(`[explore] unmatched: ${unmatched}`);
  console.log(`[explore]   of which no-lesson-title: ${skippedNoLessonTitle}`);
  console.log(`[explore] match rate: ${rate.toFixed(2)}%`);
  console.log(`[explore] unique keys matched: ${matchedKeys.size}`);
  console.log(`[explore] unique filenames used: ${matchedFilenames.size}`);

  console.log(`\n[explore] --- First 10 MATCHES ---`);
  for (const m of sampleMatches) {
    console.log(
      `  + ${m.activity_id} | lesson="${m.lesson_title}" | title="${m.title}" -> ${m.filename}`
    );
  }

  console.log(`\n[explore] --- First 10 UNMATCHED ---`);
  for (const u of sampleUnmatched) {
    console.log(
      `  - ${u.activity_id} | lesson_id=${u.lesson_id} | lesson_title="${u.lesson_title ?? ""}" | title="${u.title}"`
    );
  }
}

main().catch((err) => {
  console.error("[explore] script failed:", err);
  process.exit(1);
});
