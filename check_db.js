const db = require('better-sqlite3')('../textbook_data.db', {readonly:true});
console.log("Tables:");
console.log(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
console.log("\nLessons schema:");
console.log(db.prepare("PRAGMA table_info(lessons)").all());
console.log("\nSample Lessons:");
const ls = db.prepare("SELECT lesson_code, title_cs, teacher_guide_content, metadata FROM lessons LIMIT 5").all();
console.log(ls.slice(0, 2));
