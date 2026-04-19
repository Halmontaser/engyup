const Database = require('better-sqlite3');
const db = new Database('../textbook_data.db');

try {
    const data = db.prepare(`
        SELECT l.id, l.unit_number, l.lesson_number, l.title, p.page_number, bt.code as book_type
        FROM lessons l
        JOIN page_lessons pl ON l.id = pl.lesson_id
        JOIN pages p ON pl.page_id = p.id
        JOIN book_types bt ON p.book_type_id = bt.id
        LIMIT 20
    `).all();
    console.log(JSON.stringify(data, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
