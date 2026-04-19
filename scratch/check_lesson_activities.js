const Database = require('better-sqlite3');
const db = new Database('components.db');

try {
    const activities = db.prepare("SELECT * FROM activities WHERE lesson_id = 'g10-1.12'").all();
    console.log(JSON.stringify(activities, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
