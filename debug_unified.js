const Database = require('better-sqlite3');
const db = new Database('E:/Books/english_images/english/unified_english.db');

// Check for image 1377
const images = db.prepare("SELECT * FROM images WHERE id = ? OR original_id = ?").all('1377', '1377');
console.log('--- Image 1377 ---');
console.log(JSON.stringify(images, null, 2));

// Check tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('\n--- Tables ---');
console.log(tables.map(t => t.name).join(', '));
