const db = require('better-sqlite3')('e:/Books/english_images/clean_english_project/crescent-app/components.db');
const results = db.prepare("SELECT id FROM activities WHERE lesson_id='g7-1.10'").all();
console.log(JSON.stringify(results, null, 2));
