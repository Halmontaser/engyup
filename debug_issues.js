const Database = require('better-sqlite3');
const db = new Database('components.db');

// Check Lesson 4.6
const activities = db.prepare("SELECT * FROM activities WHERE lesson_id LIKE '%4.6%'").all();
console.log('--- Lesson 4.6 Activities ---');
console.log(JSON.stringify(activities, null, 2));

// Check Track 30
const listening = db.prepare("SELECT * FROM activities WHERE type = 'listening-comprehension' AND data LIKE '%Track 30%'").all();
console.log('\n--- Track 30 Listening ---');
console.log(JSON.stringify(listening, null, 2));
