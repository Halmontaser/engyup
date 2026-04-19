const Database = require('better-sqlite3');
const db = new Database('./components.db');

try {
    const rows = db.prepare(`
        SELECT id, type, lesson_id, data 
        FROM activities 
        WHERE lesson_id LIKE 'g10%' 
        AND data LIKE '%"audioSrc": "needed"%'
        LIMIT 15
    `).all();

    console.log(JSON.stringify(rows, null, 2));
} finally {
    db.close();
}
