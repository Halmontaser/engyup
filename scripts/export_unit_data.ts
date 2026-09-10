import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UNIT = parseInt(process.argv[2], 10);
if (isNaN(UNIT) || UNIT < 1) {
  console.error("Usage: npx tsx scripts/export_unit_data.ts <unit_number>");
  process.exit(1);
}

async function fetchInBatches<T>(
  ids: string[],
  fetchFn: (batch: string[]) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { data, error } = await fetchFn(batch);
    if (error) throw error;
    if (data) results.push(...data);
  }
  return results;
}

async function main() {
  console.log(`[export] Fetching Unit ${UNIT} data...`);

  const { data: courses, error: cErr } = await supabase
    .from("courses")
    .select("id, title")
    .ilike("title", "Grade %")
    .order("title");
  if (cErr) throw cErr;

  const courseIds = courses?.map((c) => c.id) || [];
  const { data: modules, error: mErr } = await supabase
    .from("modules")
    .select("id, course_id, title, order_index")
    .in("course_id", courseIds)
    .eq("order_index", UNIT);
  if (mErr) throw mErr;

  const moduleIds = modules?.map((m) => m.id) || [];
  const lessons = await fetchInBatches(moduleIds, (batch) =>
    supabase
      .from("lessons")
      .select("id, module_id, title, order_index, description, cover_image_src")
      .in("module_id", batch)
      .order("order_index")
  );

  const lessonIds = lessons.map((l) => l.id);
  const activities = await fetchInBatches(lessonIds, (batch) =>
    supabase
      .from("activities")
      .select(
        "activity_id, lesson_id, activity_type, title, instruction, content, order_index, difficulty, book_type, book_page, compensates"
      )
      .in("lesson_id", batch)
      .order("order_index")
  );

  const courseMap = new Map(courses?.map((c) => [c.id, c.title]));
  const moduleMap = new Map(modules?.map((m) => [m.id, m]));

  const payload = {
    unit: UNIT,
    exported_at: new Date().toISOString(),
    grades: courses?.map((c) => ({ id: c.id, title: c.title })),
    modules: modules?.map((m) => ({
      id: m.id,
      course_id: m.course_id,
      course_title: courseMap.get(m.course_id),
      title: m.title,
      order_index: m.order_index,
    })),
    lessons: lessons.map((l) => {
      const mod = moduleMap.get(l.module_id)!;
      return {
        id: l.id,
        module_id: l.module_id,
        grade: courseMap.get(mod.course_id),
        unit: mod.order_index,
        title: l.title,
        order_index: l.order_index,
        description: l.description,
        cover_image_src: l.cover_image_src,
        activities: activities
          .filter((a) => a.lesson_id === l.id)
          .map((a) => ({
            activity_id: a.activity_id,
            activity_type: a.activity_type,
            title: a.title,
            instruction: a.instruction,
            difficulty: a.difficulty,
            order_index: a.order_index,
            book_type: a.book_type,
            book_page: a.book_page,
            compensates: a.compensates,
            content: a.content,
          })),
      };
    }),
  };

  const outDir = path.join(process.cwd(), ".kimchi", "docs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `unit${UNIT}_export.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));

  // Flatten for CSV
  const flatRows: any[] = [];
  for (const lesson of payload.lessons) {
    for (const a of lesson.activities) {
      flatRows.push({
        grade: lesson.grade,
        unit: lesson.unit,
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        lesson_order: lesson.order_index,
        activity_id: a.activity_id,
        activity_type: a.activity_type,
        activity_title: a.title,
        activity_order: a.order_index,
        difficulty: a.difficulty,
        has_image: !!a.content?.imageUrl || !!a.content?.image || !!a.content?.imageSrc || !!lesson.cover_image_src,
        has_audio: !!a.content?.audioSrc || !!a.content?.originalAudioSrc || !!a.content?.audioUrl,
        has_transcript: !!a.content?.transcript,
        questions_count: Array.isArray(a.content?.questions) ? a.content.questions.length : 0,
        has_reading_text: !!(a.content?.text || a.content?.passage || a.content?.reading || a.content?.passageText),
        has_dialogue: !!(a.content?.dialogue || a.content?.dialogues || a.content?.conversation),
      });
    }
  }

  const csvPath = path.join(outDir, `unit${UNIT}_export.csv`);
  const headers = Object.keys(flatRows[0] || {});
  const csvLines = [
    headers.join(","),
    ...flatRows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const s = String(val).replace(/"/g, '""');
          return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
        })
        .join(",")
    ),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"));

  console.log(`[export] Done.`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  CSV:  ${csvPath}`);
  console.log(`  Lessons: ${lessons.length}`);
  console.log(`  Activities: ${activities.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
