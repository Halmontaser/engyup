const db = require('better-sqlite3')('e:/Books/english_images/clean_english_project/crescent-app/components.db');
const results = db.prepare("SELECT type, data FROM activities WHERE lesson_id like 'g7-%' LIMIT 15").all()
  .map(a => ({ type: a.type, data: JSON.parse(a.data) }));
console.log(JSON.stringify(results, null, 2));
