const Database = require('better-sqlite3');
const db = new Database('components.db');
const rows = db.prepare("SELECT id, type FROM activities WHERE lesson_id = 'g9-1.10'").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
