const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });
const grade = 'g7';
const activities = db.prepare(`
  SELECT id, type, title, instruction, data 
  FROM activities 
  WHERE id LIKE ? AND (length(instruction) < 20 OR instruction LIKE '%Choose%' OR instruction LIKE '%Select%' OR instruction LIKE '%Click%')
  LIMIT 30
`).all(`${grade}-%`);
console.log(JSON.stringify(activities, null, 2));
db.close();
