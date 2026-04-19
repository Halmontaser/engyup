const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('components.db');
const audioDir = 'public/media/audio';
const audioFiles = fs.existsSync(audioDir) ? fs.readdirSync(audioDir) : [];

const activities = db.prepare("SELECT id, type, data FROM activities WHERE type = 'flashcard'").all();
console.log(`Auditing ${activities.length} flashcards against ${audioFiles.length} audio files.`);

let updatedCount = 0;
db.transaction(() => {
    for (const a of activities) {
        let data = JSON.parse(a.data);
        let changed = false;

        // g10-gen-g10-u1-1.11-flashcard-0 -> g10_u1_l1.11_flsh_act0_ax.mp3
        // Naming pattern in files: grade_unit_lesson_activityType_index
        const parts = a.id.split('-');
        // parts[0] = grade (g10)
        // parts[3] = unit (u1)
        // parts[4] = lesson (1.11)
        // parts[parts.length-1] = index (0)
        
        const grade = parts[0];
        const unit = parts[3];
        const lesson = parts[4];
        const actIdx = parts[parts.length - 1];
        
        // Construct search pattern: g10_u1_l1.11_flsh_act0
        const searchPattern = `${grade}_${unit}_l${lesson}_flsh_act${actIdx}`;
        
        const match = audioFiles.find(f => f.startsWith(searchPattern));
        if (match) {
            const url = `/media/audio/${match}`;
            if (data.words && data.words[0]) {
                data.words[0].audioSrc = url;
            } else {
                data.audioSrc = url;
            }
            changed = true;
        }

        if (changed) {
            db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), a.id);
            updatedCount++;
        }
    }
})();

console.log(`Sync Complete: Linked ${updatedCount} flashcards to human audio.`);
db.close();
