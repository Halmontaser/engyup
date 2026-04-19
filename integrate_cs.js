const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const textbookDbPath = path.join(__dirname, '../textbook_data.db');
const componentsDbPath = path.join(__dirname, 'components.db');
const mediaMapPath = path.join(__dirname, 'public/media/media_map.json');
const mediaAudioDir = path.join(__dirname, 'public/media/audio'); // Check both places, but public/media/audio is where the app looks

// Ensure we have a list of all audio files
const allAudioFiles = fs.readdirSync(mediaAudioDir);

const textbookDb = new Database(textbookDbPath, { readonly: true });
const componentsDb = new Database(componentsDbPath);

console.log('Loading media_map.json...');
let mediaMap = {};
if (fs.existsSync(mediaMapPath)) {
    mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));
}

console.log('Fetching TG sections for CS and Dialogue mapping...');
const rows = textbookDb.prepare(`
    SELECT l.lesson_code, u.unit_number, u.grade_id, g.grade_number, p.markdown_content
    FROM lessons l
    JOIN page_lessons pl ON l.id = pl.lesson_id
    JOIN pages p ON pl.page_id = p.id
    JOIN units u ON l.unit_id = u.id
    JOIN grades g ON u.grade_id = g.id
    WHERE p.page_type = 'TG'
`).all();

let numCSInserted = 0;
let numDialogueLinked = 0;

componentsDb.prepare('BEGIN').run();

const insertActivity = componentsDb.prepare(`
    INSERT OR REPLACE INTO activities 
    (id, lesson_id, type, title, instruction, data, sort_order, required)
    VALUES (@id, @lesson_id, @type, @title, @instruction, @data, @sort_order, @required)
`);

const updateLessonSources = componentsDb.prepare(`
    UPDATE lessons SET sources = ? WHERE id = ?
`);

const checkLesson = componentsDb.prepare(`SELECT id, sources FROM lessons WHERE id = ?`);
const getActivitiesByLesson = componentsDb.prepare(`SELECT id, type, data FROM activities WHERE lesson_id = ?`);

for (const row of rows) {
    const gradeStr = `g${row.grade_number}`;
    const lessonId = `${gradeStr}-${row.lesson_code}`;
    const lessonRow = checkLesson.get(lessonId);

    if (!lessonRow) continue;

    const lines = row.markdown_content.split('\n');
    let extractedTracks = new Set();

    for (const line of lines) {
        const csMatch1 = line.match(/CS\s*([0-9\/\s,]+)/i);
        const csMatch2 = line.match(/Cassette Section\s+([0-9\/\s,]+)/i);
        const match = csMatch1 || csMatch2;
        if (match) {
            const numStr = match[1];
            const parts = numStr.replace(/\s+/g, '').split(/[\/,]+/);
            for (const p of parts) {
                if (p && !isNaN(parseInt(p))) extractedTracks.add(p);
            }
        }
    }

    // 1. Handle CS Activities
    if (extractedTracks.size > 0) {
        const activityId = `${lessonId}-cs-audio`;
        const sortedTracks = Array.from(extractedTracks).sort((a,b) => parseInt(a) - parseInt(b));
        
        insertActivity.run({
            id: activityId,
            lesson_id: lessonId,
            type: 'listening-comprehension',
            title: `Course Audio (Track${sortedTracks.length > 1 ? 's' : ''} ${sortedTracks.join(', ')})`,
            instruction: 'Listen to the course audio for this lesson.',
            data: JSON.stringify({
                transcript: "Listen to the course audio track(s).",
                questions: []
            }),
            sort_order: -1,
            required: 0
        });

        const folderNum = row.grade_number - 6;
        mediaMap[activityId] = {
            audio: sortedTracks.map(t => {
                const paddedTrack = t.padStart(2, '0');
                const relPath = `${folderNum}/${paddedTrack}.mp3`;
                return {
                    filename: relPath,
                    url: `/media/cs/${relPath}`,
                    audioType: 'passage'
                };
            }),
            images: mediaMap[activityId] ? mediaMap[activityId].images : []
        };

        // Update lesson sources if CS is found
        let sources = JSON.parse(lessonRow.sources || '[]');
        const csTag = `CS ${sortedTracks.join('/')}`;
        if (!sources.includes(csTag)) {
            sources.push(csTag);
            updateLessonSources.run(JSON.stringify(sources), lessonId);
        }

        numCSInserted++;
    }

    // 2. Handle Dialogue Audio (matching files in media/audio)
    // Filename pattern: g{grade}_u{unit}_l{lesson}_dlg_act{act}_a{index}.mp3
    const lessonActivities = getActivitiesByLesson.all(lessonId);
    for (const act of lessonActivities) {
        if (act.type === 'dialogue-read' || act.type === 'conversation-sim') {
            const typeKey = act.type === 'dialogue-read' ? 'dlg' : 'cnv';
            
            // Look for matching files
            // Format example: g10_u1_l1.14_dlg_act2
            // We need to find all a0, a1, a2...
            const pattern = `${gradeStr}_u${row.unit_number}_l${row.lesson_code}_${typeKey}`;
            const matchingFiles = allAudioFiles.filter(f => f.startsWith(pattern)).sort();

            if (matchingFiles.length > 0) {
                mediaMap[act.id] = {
                    audio: matchingFiles.map(f => ({
                        filename: f,
                        url: `/media/audio/${f}`,
                        audioType: 'dialogue'
                    })),
                    images: mediaMap[act.id] ? mediaMap[act.id].images : []
                };
                numDialogueLinked++;
            }
        }
    }
}

componentsDb.prepare('COMMIT').run();

fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));

console.log(`Summary:`);
console.log(`- CS activities inserted/updated: ${numCSInserted}`);
console.log(`- Dialogue/Conversation activities linked to audio: ${numDialogueLinked}`);
console.log(`- media_map.json updated.`);
