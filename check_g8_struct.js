const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const rows = db.prepare("SELECT id, type, data FROM activities WHERE lesson_id LIKE 'g8%'").all();
let issues = [];
for (const row of rows) {
    let d = JSON.parse(row.data);
    if (row.type === 'picture-description') {
        if (d.image === undefined) issues.push({id: row.id});
    }
}
console.log(`Found ${issues.length} structural issues in Grade 8.`);
db.close();
