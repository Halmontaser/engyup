const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('components.db');
const audioDir = 'public/media/audio';

if (!fs.existsSync(audioDir)) {
    console.error(`Audio directory not found: ${audioDir}`);
    process.exit(1);
}

const audioFiles = fs.readdirSync(audioDir);
console.log(`Scanning ${audioFiles.length} audio files...`);

const activities = db.prepare("SELECT id, type, data FROM activities WHERE type = 'flashcard'").all();
console.log(`Found ${activities.length} flashcard activities.`);

let updated = 0;
db.transaction(() => {
    for (const a of activities) {
        let data = JSON.parse(a.data);
        let changed = false;

        // Extract the word to match
        let word = "";
        if (data.words && data.words[0] && data.words[0].word) word = data.words[0].word;
        else if (data.word) word = data.word;

        if (word) {
            // Find a matching file (case-insensitive)
            const cleanWord = word.toLowerCase().trim().replace(/[?!.,]/g, '');
            const match = audioFiles.find(f => {
                const cleanFile = f.toLowerCase().replace(/\.(mp3|wav|ogg|m4a)$/, '').trim();
                return cleanFile === cleanWord || cleanFile.includes(cleanWord);
            });

            if (match) {
                if (data.words) {
                    data.words[0].audioSrc = `/media/audio/${match}`;
                } else {
                    data.audioSrc = `/media/audio/${match}`;
                }
                changed = true;
            }
        }

        if (changed) {
            db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), a.id);
            updated++;
        }
    }
})();

console.log(`Successfully synced ${updated} activities with physical audio files.`);
db.close();
