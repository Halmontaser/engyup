const Database = require('better-sqlite3');
const db = new Database('./components.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log("Tables in components.db:", tables.map(t => t.name));

  const counts = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM grades) as grades, 
      (SELECT COUNT(*) FROM units) as units, 
      (SELECT COUNT(*) FROM lessons) as lessons, 
      (SELECT COUNT(*) FROM activities) as activities
  `).get();
  console.log("SQLite Counts:", counts);
} catch (err) {
  console.error("Error querying SQLite components.db:", err);
} finally {
  db.close();
}
