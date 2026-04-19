const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./components.db');
const batchSize = 500;

const rows = db.prepare(`
    SELECT id, type, lesson_id, data 
    FROM activities 
    WHERE data LIKE '%"audioSrc":"needed"%'
    ORDER BY id ASC
    LIMIT ?
`).all(batchSize);

if (rows.length === 0) {
    // Try without lesson_id filter just in case
    const fallback = db.prepare(`
        SELECT id, type, lesson_id, data 
        FROM activities 
        WHERE data LIKE '%"audioSrc": "needed"%'
        ORDER BY id ASC
        LIMIT ?
    `).all(batchSize);
    rows.push(...fallback);
}

const manifest = [];
const dbUpdates = [];

rows.forEach((row, index) => {
    const data = JSON.parse(row.data);
    const audioItems = [];

    // Parse lesson_id: e.g., g10-1.12 or g7-3.15
    const lessonMatch = row.lesson_id.match(/g(\d+)[-. ](\d+)\.(\d+)/);
    let baseName = "";
    if (lessonMatch) {
       const [_, grade, unit, lesson] = lessonMatch;
       baseName = `g${grade}_u${unit}_l${unit}.${lesson}`; 
    } else {
        // Fallback for different formats (e.g. g10-1 or g7-u1-l1)
        const cleanId = row.lesson_id.replace(/[ .]/g, '-');
        const parts = cleanId.split('-');
        const grade = parts[0].startsWith('g') ? parts[0] : 'g' + parts[0];
        const unit = parts[1] || "1";
        const lesson = parts[2] || "1";
        baseName = `${grade}_u${unit}_l${unit}.${lesson}`;
    }

    const typePrefix = row.type.substring(0, 3);
    const actIdShort = row.id.split('-').pop();

    // Universal handlers for common property names containing audio
    if (data.transcript) {
        const fileName = `${baseName}_${typePrefix}_${actIdShort}.mp3`;
        audioItems.push({ text: data.transcript, fileName });
        data.audioSrc = `/media/audio/${fileName}`;
    }

    if (data.sentences) {
        data.sentences.forEach((s, sIndex) => {
            if (s.audioSrc === 'needed' || s.audio === 'needed' || (!s.audioSrc && !s.audio && s.text)) {
                const fileName = `${baseName}_${typePrefix}_${actIdShort}_s${sIndex}.mp3`;
                audioItems.push({ text: s.expectedText || s.sentence || s.text, fileName });
                s.audioSrc = `/media/audio/${fileName}`;
            }
        });
    }

    if (data.items || data.words) {
        const items = data.items || data.words;
        items.forEach((item, iIndex) => {
            if (item.audioSrc === 'needed' || item.audio === 'needed' || (!item.audioSrc && !item.audio && item.word)) {
                const fileName = `${baseName}_${typePrefix}_${actIdShort}_w${iIndex}.mp3`;
                audioItems.push({ text: item.word || item.transcript || item.text, fileName });
                item.audioSrc = `/media/audio/${fileName}`;
            }
        });
    }

    if (data.audioClips) {
        data.audioClips.forEach((clip, cIndex) => {
            if (clip.audioSrc === 'needed' || clip.audio === 'needed') {
                const fileName = `${baseName}_${typePrefix}_${actIdShort}_c${cIndex}.mp3`;
                audioItems.push({ text: clip.transcript || clip.text, fileName });
                clip.audioSrc = `/media/audio/${fileName}`;
            }
        });
    }

    if (data.questions) {
         data.questions.forEach((q, qIndex) => {
            if (q.audioSrc === 'needed' || q.audio === 'needed' || (!q.audioSrc && !q.audio && q.transcript)) {
                const fileName = `${baseName}_${typePrefix}_${actIdShort}_q${qIndex}.mp3`;
                audioItems.push({ text: q.transcript || q.text || q.question, fileName });
                q.audioSrc = `/media/audio/${fileName}`;
            }
        });
    }

    if (data.groups) {
        data.groups.forEach((group, gIndex) => {
            const items = group.items || group.words || group.phrases || [];
            items.forEach((item, iIndex) => {
                if (item.audioSrc === 'needed' || item.audio === 'needed') {
                    const fileName = `${baseName}_${typePrefix}_${actIdShort}_g${gIndex}_w${iIndex}.mp3`;
                    audioItems.push({ text: item.word || item.phrase || item.text || item.transcript, fileName });
                    item.audioSrc = `/media/audio/${fileName}`;
                }
            });
        });
    }

    if (data.phrases) {
        data.phrases.forEach((p, pIndex) => {
            if (p.audioSrc === 'needed' || p.audio === 'needed') {
                const fileName = `${baseName}_${typePrefix}_${actIdShort}_p${pIndex}.mp3`;
                audioItems.push({ text: p.phrase || p.text, fileName });
                p.audioSrc = `/media/audio/${fileName}`;
            }
        });
    }

    // Final fallback for top-level audioSrc that was missed by type-specific logic
    if (data.audioSrc === 'needed' && audioItems.length === 0) {
        const fileName = `${baseName}_${typePrefix}_${actIdShort}.mp3`;
        // Use transcript if available, otherwise title or type
        audioItems.push({ text: data.transcript || data.text || row.title || row.type, fileName });
        data.audioSrc = `/media/audio/${fileName}`;
    }

    if (audioItems.length > 0) {
        manifest.push({
            activityId: row.id,
            type: row.type,
            audioItems
        });
        dbUpdates.push({ id: row.id, data: JSON.stringify(data) });
    }
});

// Output manifest
fs.writeFileSync('scratch/audio_generation_manifest_0413.json', JSON.stringify(manifest, null, 2));

// Perform updates in transaction
const updateStmt = db.prepare('UPDATE activities SET data = ? WHERE id = ?');
const transaction = db.transaction((updates) => {
    for (const update of updates) {
        updateStmt.run(update.data, update.id);
    }
});

transaction(dbUpdates);

console.log(`Processed ${rows.length} activities.`);
console.log(`Generated manifest with ${manifest.length} activities and ${manifest.reduce((acc, m) => acc + m.audioItems.length, 0)} audio items.`);
console.log(`Manifest saved to scratch/audio_generation_manifest_0413.json`);

db.close();
