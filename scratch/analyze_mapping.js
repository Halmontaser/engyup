const Database = require('better-sqlite3');
const db = new Database('components.db');

try {
    const data = db.prepare(`
        SELECT a.id, a.title, a.type, l.sources 
        FROM activities a
        JOIN lessons l ON a.lesson_id = l.id
        LIMIT 50
    `).all();
    console.log(JSON.stringify(data, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
