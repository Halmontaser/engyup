const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: false });

const row = db.prepare("SELECT id, data FROM activities WHERE id = 'g8-gen-g8-u7-7.5-picture-description-1'").get();
if (row) {
    const data = JSON.parse(row.data);
    if (data.image === undefined) {
        data.image = "";
        db.prepare("UPDATE activities SET data = ? WHERE id = ?").run(JSON.stringify(data), row.id);
        console.log("Fixed g8-gen-g8-u7-7.5-picture-description-1 by adding missing image field.");
    } else {
        console.log("Already fixed.");
    }
} else {
    console.log("Activity not found.");
}
db.close();
