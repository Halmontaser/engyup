const Database = require('better-sqlite3');
const db = new Database('components.db');
const id = 'g9-gen-g9-u1-1.10-flashcard-1';
const row = db.prepare("SELECT id, compensates FROM activities WHERE id = ?").get(id);
console.log(JSON.stringify(row, null, 2));
db.close();
