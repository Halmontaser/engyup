const Database = require('better-sqlite3');
const db = new Database('../textbook_data.db');

try {
    console.log("--- Lessons ---");
    console.log(JSON.stringify(db.prepare("PRAGMA table_info(lessons)").all(), null, 2));
    
    console.log("\n--- Pages ---");
    console.log(JSON.stringify(db.prepare("PRAGMA table_info(pages)").all(), null, 2));
    
    console.log("\n--- Page Lessons ---");
    console.log(JSON.stringify(db.prepare("PRAGMA table_info(page_lessons)").all(), null, 2));

    console.log("\n--- Book Types ---");
    console.log(JSON.stringify(db.prepare("SELECT * FROM book_types").all(), null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
