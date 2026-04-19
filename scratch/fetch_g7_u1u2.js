const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });
const grade = 'g7';
const activities = db.prepare(`
  SELECT id, type, title, instruction, data 
  FROM activities 
  WHERE id LIKE ? AND (id LIKE '%-u1-%' OR id LIKE '%-u2-%')
`).all(`${grade}-%`);
console.log(JSON.stringify(activities, null, 2));
db.close();
