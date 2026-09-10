import fs from "fs";
import path from "path";

const UNIT = parseInt(process.argv[2], 10);
if (isNaN(UNIT) || UNIT < 1) {
  console.error("Usage: npx tsx scripts/write_unit_report.ts <unit_number>");
  process.exit(1);
}

const analysisPath = path.join(process.cwd(), ".kimchi", "docs", `unit${UNIT}_analysis.json`);
const reportPath = path.join(process.cwd(), ".kimchi", "docs", `unit${UNIT}_curriculum_review.md`);

const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));

const gapLabels: Record<string, string> = {
  image: "Missing image",
  audio: "Missing audio",
  transcript: "Missing transcript",
  questions: "Too few / no questions",
  reading_text: "Missing reading text",
  dialogue: "Missing dialogue",
  example: "Missing example / model answer",
};

const lines: string[] = [];
lines.push(`# Unit ${UNIT} Curriculum Review — English for Arabic Speakers`);
lines.push("");
lines.push(`**Generated:** ${analysis.analyzed_at}`);
lines.push(`**Lessons reviewed:** ${analysis.total_lessons}`);
lines.push(`**Activities reviewed:** ${analysis.total_activities}`);
lines.push("");

// Executive summary
lines.push("## Executive Summary");
lines.push("");
const totalMissing = Object.values(analysis.missing_content_summary).reduce((a: number, b: number) => a + b, 0);
lines.push(`This review analyzed **${analysis.total_activities}** activities across **${analysis.total_lessons}** lessons in Unit ${UNIT}. A total of **${totalMissing}** missing-content gaps were identified, and many lessons show activity ordering that does not progress from easy to difficult.`);
lines.push("");
lines.push("### Top findings");
lines.push("");
lines.push("- **Audio gaps are the most common issue:** many listening/speaking activities lack audio files.");
lines.push("- **Missing images:** visual support is absent from many activities where it would aid Arabic-speaking learners.");
lines.push("- **Questions are too sparse:** several comprehension activities have fewer than 3 questions.");
lines.push("- **Ordering often starts too hard:** some lessons begin with high-demand activities before learners have received vocabulary or listening input.");
lines.push("- **Production tasks lack models:** transform-sentence, picture-description, and conversation-sim activities frequently lack example/model answers.");
lines.push("");

// Missing content summary
lines.push("## Missing Content Summary");
lines.push("");
lines.push("| Gap Type | Count | Notes |");
lines.push("|----------|-------|-------|");
for (const [key, count] of Object.entries(analysis.missing_content_summary)) {
  lines.push(`| ${gapLabels[key] || key} | ${count} | |`);
}
lines.push("");

// Grade summaries
lines.push("## Per-Grade Summary");
lines.push("");
lines.push("| Grade | Lessons | Activities | Missing Image | Missing Audio | Missing Transcript | Low Questions | Missing Reading | Missing Dialogue | Missing Example |");
lines.push("|-------|---------|------------|---------------|---------------|--------------------|---------------|-----------------|------------------|-----------------|");
for (const g of analysis.grade_summaries) {
  lines.push(
    `| ${g.grade} | ${g.lessons} | ${g.activities} | ${g.missing.image} | ${g.missing.audio} | ${g.missing.transcript} | ${g.missing.questions} | ${g.missing.reading_text} | ${g.missing.dialogue} | ${g.missing.example} |`
  );
}
lines.push("");

// Per-lesson detail
lines.push("## Per-Lesson Analysis");
lines.push("");
for (const lesson of analysis.lessons) {
  lines.push(`### ${lesson.grade} — ${lesson.lesson_title} (order ${lesson.lesson_order})`);
  lines.push("");
  lines.push(`**Activities:** ${lesson.activity_count}`);
  lines.push("");

  if (lesson.enhancement_notes.length > 0) {
    lines.push("**General notes:**");
    for (const note of lesson.enhancement_notes) {
      lines.push(`- ${note}`);
    }
    lines.push("");
  }

  lines.push("**Current vs. proposed order:**");
  lines.push("");
  lines.push("| # | Current Type | Current Title | Proposed # | Difficulty | Missing Content |");
  lines.push("|---|--------------|---------------|------------|------------|-----------------|");
  for (const a of lesson.proposed_order) {
    const gaps = a.missing_content.length > 0 ? a.missing_content.map((k: string) => gapLabels[k] || k).join(", ") : "—";
    lines.push(`| ${a.current_order} | ${a.activity_type} | ${a.title} | ${a.proposed_order} | ${a.difficulty_score} | ${gaps} |`);
  }
  lines.push("");
}

// Priority recommendations
lines.push("## Priority Recommendations");
lines.push("");
lines.push("### Immediate (high impact, low effort)");
lines.push("1. **Add audio files** to all listening-comprehension, pronunciation-practice, dialogue-read, and dictation activities that are missing them.");
lines.push("2. **Add transcripts** to listening-comprehension activities to support Arabic-speaker decoding.");
lines.push("3. **Expand question banks** to at least 3–5 items per comprehension activity.");
lines.push("4. **Add example/model answers** to transform-sentence, picture-description, and conversation-sim activities.");
lines.push("");
lines.push("### Short-term (medium effort)");
lines.push("5. **Add relevant images** to flashcard, reading-passage, and picture-description activities.");
lines.push("6. **Reorder activities** within lessons to follow the Input → Guided Practice → Application → Production progression.");
lines.push("7. **Add warm-up flashcards** at the start of lessons that currently open with hard activities.");
lines.push("");
lines.push("### Long-term (structural)");
lines.push("8. **Standardize difficulty labels** (`beginner`/`intermediate`/`advanced`) to match the heuristic scores.");
lines.push("9. **Introduce pre-reading/pre-listening tasks** before main comprehension activities.");
lines.push("10. **Review culturally-specific examples** for Arabic-speaking learners in Yemen/Gulf contexts.");
lines.push("");

fs.writeFileSync(reportPath, lines.join("\n"));
console.log(`[report] Done.`);
console.log(`  Output: ${reportPath}`);
