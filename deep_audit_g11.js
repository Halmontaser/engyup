const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./components.db', { readonly: true });
const imagesDir = path.join(__dirname, 'public/media/images');
const audioDir = path.join(__dirname, 'public/media/audio');

// 1. Audit components.db for g11
const rows = db.prepare("SELECT id, type, data FROM activities WHERE lesson_id LIKE 'g11%'").all();
const counts = {};
const issues = [];
const missingImages = [];

rows.forEach(row => {
    let d = JSON.parse(row.data);
    counts[row.type] = (counts[row.type] || 0) + 1;
    
    // Check for inconsistent keys
    if (row.type === 'transform-sentence') {
        if (d.items && !d.sentences) issues.push({id: row.id, type: row.type, current: 'items', target: 'sentences'});
    }
    if (row.type === 'gap-fill') {
        if (!d.sentences && (d.items || d.gaps)) issues.push({id: row.id, type: row.type, current: d.items ? 'items' : 'gaps', target: 'sentences'});
    }
    if (row.type === 'match-pairs') {
        if (d.items && !d.pairs) issues.push({id: row.id, type: row.type, current: 'items', target: 'pairs'});
    }
    if (row.type === 'word-order') {
        if (d.items && !d.sentences) issues.push({id: row.id, type: row.type, current: 'items', target: 'sentences'});
    }
    if (row.type === 'picture-description') {
        if (d.image === undefined) missingImages.push(row.id);
    }
});

console.log('Grade 9 Activity Counts:', counts);
console.log('Total g11 Activities:', rows.length);
console.log('Structural normalization needed for:', issues.length, 'activities');
console.log('Missing image fields in picture-description:', missingImages.length);

// 2. Audit media directories
let g11Images = 0;
let g11Audios = 0;

if (fs.existsSync(imagesDir)) {
    g11Images = fs.readdirSync(imagesDir).filter(f => f.startsWith('g11_')).length;
}
if (fs.existsSync(audioDir)) {
    g11Audios = fs.readdirSync(audioDir).filter(f => f.startsWith('g11_')).length;
}

console.log(`Grade 9 Images found: ${g11Images}`);
console.log(`Grade 9 Audio files found: ${g11Audios}`);

db.close();


