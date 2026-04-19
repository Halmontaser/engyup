const Database = require('better-sqlite3');
const db = new Database('components.db');
const id = 'g9-u1-hol-flash';
const row = db.prepare("SELECT * FROM activities WHERE id = ?").get(id);
console.log(JSON.stringify(row, null, 2));
db.close();
