const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const acts = db.prepare("SELECT id, type, sort_order FROM activities WHERE lesson_id = 'g8-1.10' ORDER BY sort_order").all();
console.log('Activities for g8-1.10:');
acts.forEach((a, i) => {
    console.log(`Index ${i} (act${i}): type=${a.type}, id=${a.id}, sort_order=${a.sort_order}`);
});
db.close();
