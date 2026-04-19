const db = require("better-sqlite3")("./components.db");
const tables = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log(t.sql + ";\n"));
const counts = db.prepare("SELECT (SELECT COUNT(*) FROM grades) as g, (SELECT COUNT(*) FROM units) as u, (SELECT COUNT(*) FROM lessons) as l, (SELECT COUNT(*) FROM activities) as a").get();
console.log("Counts:", JSON.stringify(counts));
