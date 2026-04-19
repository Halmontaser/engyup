const db = require('better-sqlite3')('components.db');
const lessons = db.prepare("SELECT id, sources, extra_meta FROM lessons WHERE id LIKE 'g7-1.%' LIMIT 10").all();
console.log(JSON.stringify(lessons, null, 2));
