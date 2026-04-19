const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });

const rows = db.prepare("SELECT id, type, data FROM activities WHERE lesson_id LIKE 'g8%'").all();

const counts = {};
const issues = [];

rows.forEach(row => {
    let d = JSON.parse(row.data);
    counts[row.type] = (counts[row.type] || 0) + 1;
    
    // Check for "items" vs "sentences" etc
    if (row.type === 'transform-sentence') {
        if (d.items && !d.sentences) {
            issues.push({id: row.id, type: row.type, current: 'items', target: 'sentences'});
        }
    }
    if (row.type === 'gap-fill') {
        if (!d.sentences && (d.items || d.gaps)) {
             issues.push({id: row.id, type: row.type, current: d.items ? 'items' : 'gaps', target: 'sentences'});
        }
    }
    if (row.type === 'match-pairs') {
        if (d.items && !d.pairs) {
            issues.push({id: row.id, type: row.type, current: 'items', target: 'pairs'});
        }
    }
    if (row.type === 'word-order') {
        if (d.items && !d.sentences) {
            issues.push({id: row.id, type: row.type, current: 'items', target: 'sentences'});
        }
    }
});

console.log('Grade 8 Activity Counts:', counts);
console.log('Structural normalization needed for:', issues.length, 'activities');
if (issues.length > 0) {
    console.log('Sample issues:', issues.slice(0, 10));
}

db.close();
