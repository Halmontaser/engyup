const Database = require('better-sqlite3');
const db = new Database('components.db');

try {
    const activities = db.prepare(`
        SELECT a.id, a.type, a.title, l.id as lesson_id
        FROM activities a
        JOIN lessons l ON a.lesson_id = l.id
        WHERE a.difficulty IS NULL
    `).all();

    console.log(`Assigning difficulty to ${activities.length} activities...`);

    const updateStmt = db.prepare("UPDATE activities SET difficulty = ? WHERE id = ?");

    const batchUpdates = db.transaction((updates) => {
        for (const u of updates) {
            updateStmt.run(u.difficulty, u.id);
        }
    });

    const pendingUpdates = [];

    activities.forEach(a => {
        const lessonId = a.lesson_id; // e.g. g10-1.12
        const gradeNum = parseInt(lessonId.match(/g(\d+)/)?.[1] || "10", 10);
        const unitNum = parseInt(lessonId.split('-')[1]?.split('.')[0] || "1", 10);
        
        let diff = 'intermediate';

        // Heuristics
        if (gradeNum <= 8) {
            diff = unitNum <= 2 ? 'beginner' : 'intermediate';
        } else if (gradeNum <= 10) {
            if (unitNum <= 2) diff = 'beginner';
            else if (unitNum <= 5) diff = 'intermediate';
            else diff = 'advanced';
        } else {
            // Grade 11-12
            diff = unitNum <= 2 ? 'intermediate' : 'advanced';
        }

        // Adjust by type
        const easyTypes = ['flashcard', 'picture-description', 'matching-pairs', 'true-false'];
        const hardTypes = ['transform-sentence', 'dictation', 'listening-comprehension', 'spelling-bee', 'gap-fill'];

        if (easyTypes.includes(a.type) && diff === 'advanced') diff = 'intermediate';
        if (easyTypes.includes(a.type) && diff === 'intermediate') diff = 'beginner';
        if (hardTypes.includes(a.type) && diff === 'beginner') diff = 'intermediate';
        if (hardTypes.includes(a.type) && diff === 'intermediate') {
             // For gap fills, if many questions/gaps, it might be advanced
             // But for now let's keep it intermediate
        }

        pendingUpdates.push({ difficulty: diff, id: a.id });
    });

    batchUpdates(pendingUpdates);
    console.log(`Successfully updated ${pendingUpdates.length} activities with difficulty levels.`);

} catch (err) {
    console.error("Migration failed:", err);
} finally {
    db.close();
}
