const Database = require('better-sqlite3');
const db = new Database('components.db');

try {
    console.log("--- Activities (first 5) ---");
    const activities = db.prepare("SELECT * FROM activities LIMIT 5").all();
    console.log(JSON.stringify(activities, null, 2));

    console.log("\n--- Lessons (first 5) ---");
    const lessons = db.prepare("SELECT * FROM lessons LIMIT 5").all();
    console.log(JSON.stringify(lessons, null, 2));
} catch (err) {
    console.error(err);
    process.exit(1);
} finally {
    db.close();
}
