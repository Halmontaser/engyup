const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });
const grade = 'g7';
const activities = db.prepare(`
  SELECT id, type, title, instruction, data 
  FROM activities 
  WHERE id LIKE ? AND (id LIKE '%-u3-%' OR id LIKE '%-u4-%' OR id LIKE '%-u5-%' OR id LIKE '%-u6-%' OR id LIKE '%-u7-%' OR id LIKE '%-u8-%')
`).all(`${grade}-%`);
console.log(`Found ${activities.length} activities for enrichment in G7 Units 3-8.`);
// Print a small sample for context
console.log(JSON.stringify(activities.slice(0, 5), null, 2));
db.close();
