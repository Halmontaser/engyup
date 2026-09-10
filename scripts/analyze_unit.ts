import fs from "fs";
import path from "path";

const UNIT = parseInt(process.argv[2], 10);
if (isNaN(UNIT) || UNIT < 1) {
  console.error("Usage: npx tsx scripts/analyze_unit.ts <unit_number>");
  process.exit(1);
}

const exportPath = path.join(process.cwd(), ".kimchi", "docs", `unit${UNIT}_export.json`);
const outPath = path.join(process.cwd(), ".kimchi", "docs", `unit${UNIT}_analysis.json`);

const data = JSON.parse(fs.readFileSync(exportPath, "utf-8"));

const typeDifficulty: Record<string, number> = {
  flashcard: 1.0,
  "pronunciation-practice": 1.3,
  "image-label": 1.5,
  "guessing-game": 1.8,
  mcq: 2.0,
  "true-false": 2.2,
  "match-pairs": 2.4,
  "word-order": 2.6,
  "category-sort": 2.6,
  "gap-fill": 2.8,
  "listening-comprehension": 3.0,
  "reading-passage": 3.2,
  "dialogue-read": 3.4,
  "transform-sentence": 3.6,
  "conversation-sim": 3.8,
  dictation: 3.9,
  "picture-description": 4.0,
  "spelling-bee": 4.2,
};

function countWords(text: any): number {
  if (!text) return 0;
  const s = typeof text === "string" ? text : JSON.stringify(text);
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

function detectMissingContent(activity: any): string[] {
  const gaps: string[] = [];
  const c = activity.content || {};
  const type = activity.activity_type;

  const hasImage = !!c.imageUrl || !!c.image || !!c.imageSrc || !!c.images;
  const hasAudio = !!c.audioSrc || !!c.originalAudioSrc || !!c.audioUrl || !!c.audio || !!c.audioFiles;
  const hasTranscript = !!c.transcript;
  const questionsCount = Array.isArray(c.questions) ? c.questions.length : 0;
  const hasReadingText = !!(c.text || c.passage || c.reading || c.passageText);
  const hasDialogue = !!(c.dialogue || c.dialogues || c.conversation);
  const hasExample = !!(c.example || c.examples || c.modelAnswer || c.model);

  const imageTypes = new Set(["flashcard", "image-label", "guessing-game", "picture-description", "reading-passage", "dialogue-read"]);
  const audioTypes = new Set(["listening-comprehension", "pronunciation-practice", "dialogue-read", "dictation", "spelling-bee"]);
  const transcriptTypes = new Set(["listening-comprehension", "dialogue-read", "dictation"]);
  const questionTypes = new Set(["mcq", "true-false", "listening-comprehension", "reading-passage", "picture-description"]);
  const readingTypes = new Set(["reading-passage", "dialogue-read"]);
  const dialogueTypes = new Set(["dialogue-read", "conversation-sim"]);

  if (imageTypes.has(type) && !hasImage) gaps.push("image");
  if (audioTypes.has(type) && !hasAudio) gaps.push("audio");
  if (transcriptTypes.has(type) && !hasTranscript) gaps.push("transcript");
  if (questionTypes.has(type) && questionsCount < 3) gaps.push("questions");
  if (readingTypes.has(type) && !hasReadingText) gaps.push("reading_text");
  if (dialogueTypes.has(type) && !hasDialogue) gaps.push("dialogue");
  if (["transform-sentence", "picture-description", "conversation-sim"].includes(type) && !hasExample) gaps.push("example");

  return gaps;
}

function scoreActivity(activity: any): number {
  const base = typeDifficulty[activity.activity_type] || 3.0;
  const contentSize = countWords(activity.content);
  const sizeBonus = contentSize > 200 ? 0.5 : contentSize > 100 ? 0.3 : contentSize > 50 ? 0.1 : 0;
  const qCount = Array.isArray(activity.content?.questions) ? activity.content.questions.length : 0;
  const questionBonus = qCount > 5 ? 0.4 : qCount > 3 ? 0.2 : 0;
  const supportPenalty = detectMissingContent(activity).includes("audio") || detectMissingContent(activity).includes("transcript") ? 0.2 : 0;
  return Math.min(5, Math.max(1, base + sizeBonus + questionBonus + supportPenalty));
}

function proposeOrder(activities: any[]): any[] {
  const scored = activities.map((a, idx) => ({ ...a, original_index: idx, score: scoreActivity(a) }));
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return (a.original_index || 0) - (b.original_index || 0);
  });
  return scored.map((a, idx) => ({
    activity_id: a.activity_id,
    activity_type: a.activity_type,
    title: a.title,
    current_order: a.order_index,
    proposed_order: idx,
    difficulty_score: Number(a.score.toFixed(2)),
    missing_content: detectMissingContent(a),
  }));
}

const results = {
  unit: UNIT,
  analyzed_at: new Date().toISOString(),
  total_lessons: data.lessons.length,
  total_activities: data.lessons.reduce((acc: number, l: any) => acc + l.activities.length, 0),
  missing_content_summary: {
    image: 0,
    audio: 0,
    transcript: 0,
    questions: 0,
    reading_text: 0,
    dialogue: 0,
    example: 0,
  },
  grade_summaries: [] as any[],
  lessons: [] as any[],
};

for (const lesson of data.lessons) {
  const lessonAnalysis = {
    lesson_id: lesson.id,
    grade: lesson.grade,
    unit: lesson.unit,
    lesson_title: lesson.title,
    lesson_order: lesson.order_index,
    activity_count: lesson.activities.length,
    proposed_order: proposeOrder(lesson.activities),
    enhancement_notes: [] as string[],
  };

  // Enhancement notes
  const hasListening = lesson.activities.some((a: any) => a.activity_type === "listening-comprehension");
  const hasFlashcards = lesson.activities.some((a: any) => a.activity_type === "flashcard");
  const firstActivity = lesson.activities[0];
  const lastActivity = lesson.activities[lesson.activities.length - 1];

  if (!hasFlashcards && lesson.activities.length > 2) {
    lessonAnalysis.enhancement_notes.push("Consider adding a flashcard/pronunciation warm-up at the start to pre-teach key vocabulary.");
  }
  if (hasListening && !lesson.activities.some((a: any) => a.content?.transcript)) {
    lessonAnalysis.enhancement_notes.push("Add transcripts to listening-comprehension activities for Arabic-speaker scaffolding.");
  }
  if (firstActivity && scoreActivity(firstActivity) > 2.5) {
    lessonAnalysis.enhancement_notes.push("First activity is relatively hard; consider starting with a lower-stakes recognition task.");
  }
  if (lastActivity && scoreActivity(lastActivity) < 3) {
    lessonAnalysis.enhancement_notes.push("Final activity is quite easy; consider ending with a production or application task.");
  }

  results.lessons.push(lessonAnalysis);

  for (const a of lesson.activities) {
    const gaps = detectMissingContent(a);
    for (const g of gaps) {
      if (g in results.missing_content_summary) {
        (results.missing_content_summary as any)[g]++;
      }
    }
  }
}

// Grade summaries
const byGrade: Record<string, { lessons: number; activities: number; missing: Record<string, number> }> = {};
for (const lesson of data.lessons) {
  const g = lesson.grade;
  if (!byGrade[g]) byGrade[g] = { lessons: 0, activities: 0, missing: { image: 0, audio: 0, transcript: 0, questions: 0, reading_text: 0, dialogue: 0, example: 0 } };
  byGrade[g].lessons++;
  byGrade[g].activities += lesson.activities.length;
  for (const a of lesson.activities) {
    for (const gap of detectMissingContent(a)) {
      byGrade[g].missing[gap]++;
    }
  }
}
results.grade_summaries = Object.entries(byGrade).map(([grade, info]) => ({ grade, ...info }));

fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`[analyze] Done.`);
console.log(`  Output: ${outPath}`);
console.log(`  Lessons: ${results.total_lessons}`);
console.log(`  Activities: ${results.total_activities}`);
console.log(`  Missing content summary:`, results.missing_content_summary);
