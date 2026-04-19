const Database = require('better-sqlite3');
const db = new Database('../textbook_data.db');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(JSON.stringify(tables, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
