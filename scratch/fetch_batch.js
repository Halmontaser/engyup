const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });
const batchSize = 10;
const offset = 0;
const rows = db.prepare(`SELECT id, title, instruction, data FROM activities WHERE type = 'mcq' LIMIT ? OFFSET ?`).all(batchSize, offset);
console.log(JSON.stringify(rows, null, 2));
db.close();
