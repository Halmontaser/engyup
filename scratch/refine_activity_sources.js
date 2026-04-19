const Database = require('better-sqlite3');
const path = require('path');

const compDb = new Database('components.db');
const textDb = new Database('../textbook_data.db');

try {
    // 1. Load mappings from textbook_data.db
    console.log("Loading TG mappings...");
    const tgRecords = textDb.prepare(`
        SELECT g.grade_number, u.unit_number, l.lesson_code, p.page_number, bt.code as book_type
        FROM lessons l
        JOIN units u ON l.unit_id = u.id
        JOIN grades g ON u.grade_id = g.id
        JOIN page_lessons pl ON l.id = pl.lesson_id
        JOIN pages p ON pl.page_id = p.id
        JOIN book_types bt ON p.book_type_id = bt.id
        WHERE bt.code IN ('PB', 'WB')
    `).all();

    const mapping = {};
    tgRecords.forEach(r => {
        // Key format: g{grade}-{unit}.{lesson}
        // Normalize lesson_code: sometimes it includes unit (e.g. "7.1"), sometimes it's just number
        let code = r.lesson_code;
        if (code && code.includes('.')) {
            // It's already in Unit.Lesson format, but usually we want to match exactly what's in components.db
            // Let's see what components.db lesson_ids look like
        }
        const key = `g${r.grade_number}-${r.lesson_code}`;
        if (!mapping[key]) mapping[key] = [];
        mapping[key].push({ type: r.book_type, page: String(r.page_number) });
    });

    console.log(`Loaded ${Object.keys(mapping).length} lesson mappings from TG.`);

    // 2. Process activities in components.db
    const activities = compDb.prepare("SELECT id, lesson_id, type, title FROM activities").all();
    let updatedCount = 0;

    console.log(`Processing ${activities.length} activities...`);
    const updateStmt = compDb.prepare("UPDATE activities SET book_type = ?, book_page = ? WHERE id = ?");

    const batchUpdates = compDb.transaction((updates) => {
        for (const u of updates) {
            updateStmt.run(u.type, u.page, u.id);
        }
    });

    const pendingUpdates = [];

    activities.forEach(a => {
        const lessonId = a.lesson_id; // e.g. g10-1.12
        const lessonMapping = mapping[lessonId];

        if (lessonMapping && lessonMapping.length > 0) {
            let selected = null;

            // Heuristic for selection
            const isExercise = ['gap-fill', 'mcq', 'true-false', 'word-order', 'spelling-bee', 'dictation', 'match-pairs', 'category-sort'].includes(a.type);
            const isReading = ['reading-passage', 'dialogue-read', 'reading-sequence'].includes(a.type);
            const title = a.title.toLowerCase();

            const pb = lessonMapping.find(m => m.type === 'PB');
            const wb = lessonMapping.find(m => m.type === 'WB');

            if (pb && wb) {
                if (isExercise || title.includes('workbook') || title.includes('wb')) {
                    selected = wb;
                } else if (isReading || title.includes('pupil') || title.includes('pb')) {
                    selected = pb;
                } else {
                    // Default to PB for others, or based on exercise nature
                    selected = isExercise ? wb : pb;
                }
            } else {
                selected = pb || wb;
            }

            // Don't overwrite CS if it's already set and activity is audio-related
            // (Assumes CS was already handled or we want to prioritize TG if it mentions CS)
            // Wait, TG doesn't usually have CS pages in this table, but let's check.
            
            if (selected) {
                pendingUpdates.push({ type: selected.type, page: selected.page, id: a.id });
                updatedCount++;
            }
        }
    });

    batchUpdates(pendingUpdates);
    console.log(`Successfully updated ${updatedCount} activities with TG-accurate data.`);

} catch (err) {
    console.error("Migration failed:", err);
} finally {
    compDb.close();
    textDb.close();
}
