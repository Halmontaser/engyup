const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('components.db');
const mediaMapPath = path.join(__dirname, 'public', 'media', 'media_map.json');
let mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));

const destVocabAudioDir = path.join(__dirname, 'public', 'media', 'audio', 'vocab');
if (!fs.existsSync(destVocabAudioDir)) fs.mkdirSync(destVocabAudioDir, { recursive: true });

// 1. Map pronunciations_uk to vocab audio
const audioSource = 'E:\\Books\\english_images\\english\\pronunciations_uk';
if (fs.existsSync(audioSource)) {
    const files = fs.readdirSync(audioSource);
    files.forEach(file => {
        if (file.endsWith('.mp3')) {
            // format: 0018_square.mp3
            let word = file.replace(/^[0-9]+_/, '').replace('.mp3', '').toLowerCase();
            let destFile = `${word}.mp3`;
            let destPath = path.join(destVocabAudioDir, destFile);
            
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(path.join(audioSource, file), destPath);
            }
            
            // Map both the clean word AND the original ID if requested
            mediaMap[word] = `/media/audio/vocab/${destFile}`;
            mediaMap[`${word}.mp3`] = `/media/audio/vocab/${destFile}`;
        }
    });
}

// 2. Identify orphaned IDs and match if possible
const grades = ['g10', 'g11', 'g12'];
let audioFixed = 0;
let imagesSanitized = 0;

const updateActivity = db.prepare(`UPDATE activities SET data = ? WHERE id = ?`);

grades.forEach(grade => {
    const rows = db.prepare(`SELECT id, data FROM activities WHERE id LIKE '${grade}%'`).all();
    rows.forEach(row => {
        let data = JSON.parse(row.data);
        let changed = false;

        const processObject = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            
            // Fix Audio
            if (obj.audio) {
                let a = (obj.audio || '').toLowerCase().replace('.mp3', '');
                if (!mediaMap[obj.audio] && mediaMap[a]) {
                    obj.audio = a; // normalize to mapped key
                    changed = true;
                    audioFixed++;
                }
            }

            // Fix Legacy Numeric Images
            if (obj.image) {
                if (/^[0-9]+$/.test(obj.image)) {
                    // It's a legacy ID like "520". Null it out.
                    obj.image = null; 
                    changed = true;
                    imagesSanitized++;
                } else if (typeof obj.image === 'string' && !mediaMap[obj.image]) {
                    // Check if cleaning the image name helps (e.g. "Scene 1")
                    let clean = obj.image.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (mediaMap[clean]) {
                        obj.image = clean;
                        changed = true;
                    }
                }
            }

            Object.values(obj).forEach(v => {
                if (Array.isArray(v)) v.forEach(processObject);
                else if (typeof v === 'object') processObject(v);
            });
        };

        processObject(data);

        if (changed) {
            updateActivity.run(JSON.stringify(data), row.id);
        }
    });
});

fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));

console.log(`Sanitization Complete.`);
console.log(`Audio IDs Resolved/Normalized: ${audioFixed}`);
console.log(`Legacy Numeric Images Removed: ${imagesSanitized}`);
