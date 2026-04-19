const db = require('better-sqlite3')('e:/Books/english_images/clean_english_project/crescent-app/components.db');
const results = db.prepare("SELECT data FROM activities WHERE type='match-pairs' LIMIT 1").get();
console.log(JSON.stringify(JSON.parse(results.data), null, 2));
