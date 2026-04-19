const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('components.db');
const mediaMapPath = path.join(__dirname, 'public', 'media', 'media_map.json');
const mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));

const publicPath = path.join(__dirname, 'public');

function checkFile(mediaId) {
    if (!mediaId) return true;
    const mediaPath = mediaMap[mediaId];
    if (!mediaPath) {
        return { error: 'NOT_IN_MAP', id: mediaId };
    }
    const fullPath = path.join(publicPath, mediaPath);
    if (!fs.existsSync(fullPath)) {
        return { error: 'FILE_MISSING', id: mediaId, path: mediaPath };
    }
    return true;
}

const grades = ['g10', 'g11', 'g12'];
const results = {};

grades.forEach(grade => {
    const activities = db.prepare(`SELECT id, type, data FROM activities WHERE id LIKE '${grade}%'`).all();
    let totalMediaRefs = 0;
    let errors = [];

    activities.forEach(act => {
        const data = JSON.parse(act.data);
        
        // Check top-level image/audio
        if (data.image) {
            const res = checkFile(data.image);
            totalMediaRefs++;
            if (res !== true) errors.push({ actId: act.id, field: 'image', ...res });
        }
        if (data.audio) {
            const res = checkFile(data.audio);
            totalMediaRefs++;
            if (res !== true) errors.push({ actId: act.id, field: 'audio', ...res });
        }

        // Check cards (flashcards)
        if (data.cards) {
            data.cards.forEach((card, i) => {
                if (card.image) {
                    const res = checkFile(card.image);
                    totalMediaRefs++;
                    if (res !== true) errors.push({ actId: act.id, field: `card[${i}].image`, ...res });
                }
                if (card.audio) {
                    const res = checkFile(card.audio);
                    totalMediaRefs++;
                    if (res !== true) errors.push({ actId: act.id, field: `card[${i}].audio`, ...res });
                }
            });
        }
        
        // Check list/items (multi-item activities)
        const itemFields = ['items', 'sentences', 'questions', 'options'];
        itemFields.forEach(f => {
            if (Array.isArray(data[f])) {
                data[f].forEach((item, i) => {
                   if (item.image) {
                       const res = checkFile(item.image);
                       totalMediaRefs++;
                       if (res !== true) errors.push({ actId: act.id, field: `${f}[${i}].image`, ...res });
                   }
                   if (item.audio) {
                       const res = checkFile(item.audio);
                       totalMediaRefs++;
                       if (res !== true) errors.push({ actId: act.id, field: `${f}[${i}].audio`, ...res });
                   }
                });
            }
        });
    });

    results[grade] = {
        totalActivities: activities.length,
        totalMediaRefs,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // Show first 10
    };
});

console.log(JSON.stringify(results, null, 2));
