const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });

const types = db.prepare("SELECT DISTINCT type FROM activities WHERE lesson_id LIKE 'g8%' ORDER BY type").all().map(r => r.type);

console.log(`\n=== GRADE 8 ACTIVITY AUDIT (${types.length} types) ===\n`);

for (const type of types) {
  const rows = db.prepare("SELECT id, data FROM activities WHERE lesson_id LIKE 'g8%' AND type = ? LIMIT 3").all(type);
  console.log(`\n─── ${type} (${rows.length} samples) ───`);
  
  for (const row of rows) {
    try {
      const d = JSON.parse(row.data);
      const topKeys = Object.keys(d);
      console.log(`  ${row.id}`);
      console.log(`    top keys: [${topKeys.join(', ')}]`);
    } catch(e) {
      console.log(`  ${row.id}: ERROR parsing JSON: ${e.message}`);
    }
  }
}

db.close();
