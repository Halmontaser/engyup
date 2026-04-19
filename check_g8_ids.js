const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const g8_lesson_ids_act = db.prepare("SELECT DISTINCT lesson_id FROM activities WHERE lesson_id LIKE 'g8%' LIMIT 10").all();
console.log('From activities:', g8_lesson_ids_act);

const g8_lesson_ids_les = db.prepare("SELECT id FROM lessons WHERE id LIKE 'g8%' LIMIT 10").all();
console.log('From lessons:', g8_lesson_ids_les);

db.close();
