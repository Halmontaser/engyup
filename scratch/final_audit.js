const Database = require('better-sqlite3');
const db = new Database('./components.db');

const row = db.prepare('SELECT COUNT(*) as count FROM activities WHERE data LIKE \'%"audioSrc":"needed"%\'').get();
console.log('Final Audit Result:', row.count);

if (row.count > 0) {
    const samples = db.prepare('SELECT id, lesson_id FROM activities WHERE data LIKE \'%"audioSrc":"needed"%\' LIMIT 5').all();
    console.log('Sample Gaps:', samples);
}

db.close();
