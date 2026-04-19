const Database = require('better-sqlite3');
const db = new Database('components.db');

const dialogues = db.prepare(`
    SELECT id, type, title, data 
    FROM activities 
    WHERE type LIKE '%dialogue%' OR type LIKE '%listening%'
`).all();

const summary = dialogues.map(d => {
    const data = JSON.parse(d.data);
    const lines = data.dialogue || data.lines || data.conversation || [];
    const characters = [...new Set(lines.map(l => l.name || l.character || l.speaker).filter(Boolean))];
    return {
        id: d.id,
        type: d.type,
        title: d.title,
        characterCount: characters.length,
        characters
    };
});

console.log(JSON.stringify(summary.slice(0, 20), null, 2));
console.log(`\nTotal dialogue activities found: ${summary.length}`);

db.close();
