const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const csActivities = db.prepare("SELECT id FROM activities WHERE id LIKE '%g8%-cs-audio%'").all();
console.log('CS for G8:', csActivities);
db.close();
