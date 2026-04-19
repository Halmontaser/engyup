const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });
const row = db.prepare("SELECT type, data FROM activities WHERE id = 'g8-gen-g8-u1-1.11-gap-fill-5'").get();
console.log(row.type, Object.keys(JSON.parse(row.data)));
db.close();
