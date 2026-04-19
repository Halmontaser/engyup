const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const g7_act = db.prepare("SELECT id FROM activities WHERE lesson_id LIKE 'g7%' LIMIT 5").all();
console.log('G7 Activities:', g7_act);
db.close();
