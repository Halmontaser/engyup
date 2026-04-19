const Database = require('better-sqlite3');
const db = new Database('E:/Books/english_images/english/unified_english.db');

// Check tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('--- Tables in unified_english.db ---');
console.log(tables.map(t => t.name).join(', '));
if (tables.some(t => t.name === 'media')) {
    const sample = db.prepare("SELECT * FROM media LIMIT 5").all();
    console.log('\n--- Sample Media ---');
    console.log(JSON.stringify(sample, null, 2));
}
