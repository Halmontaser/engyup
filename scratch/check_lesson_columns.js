const Database = require('better-sqlite3');
const db = new Database('../textbook_data.db');

try {
    const columns = db.prepare("PRAGMA table_info(lessons)").all();
    console.log(JSON.stringify(columns, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
