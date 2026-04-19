const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });

// 1. Fetch activities that need instruction/feedback enrichment
const activities = db.prepare(`
  SELECT id, type, title, instruction, data 
  FROM activities 
  WHERE id LIKE 'g7-%' 
  AND (length(instruction) < 25 OR instruction LIKE '%Choose%' OR instruction LIKE '%Select%' OR instruction LIKE '%Click%' OR instruction LIKE '%Look%')
  LIMIT 50
`).all();

// 2. Identify lessons in Grade 7 with < 3 activities
const lowPopLessons = db.prepare(`
  SELECT l.id, COUNT(a.id) as act_count
  FROM lessons l
  LEFT JOIN activities a ON l.id = a.lesson_id
  WHERE l.id LIKE 'g7-%'
  GROUP BY l.id
  HAVING act_count < 3
`).all();

console.log(JSON.stringify({ activities, lowPopLessons }, null, 2));
db.close();
