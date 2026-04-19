const db = require('better-sqlite3')('e:/Books/english_images/clean_english_project/crescent-app/components.db');
const results = db.prepare("SELECT data FROM activities WHERE lesson_id='g7-1.10' AND type='match-pairs'").all();
console.log(JSON.stringify(results.map(r=>JSON.parse(r.data)), null, 2));
