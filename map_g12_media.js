const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'components.db');
const mediaMapPath = path.join(__dirname, 'public/media/media_map.json');
const imagesDir = path.join(__dirname, 'public/media/images');
const audioDir = path.join(__dirname, 'public/media/audio');

const db = new Database(dbPath, { readonly: true });

// 1. Get all g12 activities, group by lesson, sorted by sort_order
const rows = db.prepare(`SELECT id, lesson_id, type, sort_order FROM activities WHERE lesson_id LIKE 'g12%' ORDER BY lesson_id, sort_order`).all();

// Build lesson -> activities array
const lessonActivities = {};
rows.forEach(row => {
    if (!lessonActivities[row.lesson_id]) {
        lessonActivities[row.lesson_id] = [];
    }
    lessonActivities[row.lesson_id].push(row);
});

// Create lookup maps
// lessonMap handles formatting like "1_10" or "1.10" to match standard "1.10"
function normalizeLessonNumber(str) {
    return str.replace('_', '.');
}

// Map parsed details to activity ID
// Activity index mapping: g12 -> uX -> lX.Y -> actZ -> activity_id
const activityIndexMap = {}; 

for (const [lessonId, activities] of Object.entries(lessonActivities)) {
    // lessonId is usually like 'g12-1.10'
    const parts = lessonId.split('-');
    if (parts.length >= 2) {
        const lessonNum = parts[1]; // '1.10'
        activities.forEach((act, actIndex) => {
            // key: {lesson}_{actIndex} -> activity_id
            const key = `${lessonNum}_act${actIndex}`;
            activityIndexMap[key] = act.id;
        });
    }
}

let mediaMap = {};
if (fs.existsSync(mediaMapPath)) {
    mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));
}

// Function to safely init activity in mediaMap
function initActivityInMap(actId) {
    if (!mediaMap[actId]) {
        mediaMap[actId] = { audio: [], images: [] };
    }
}

// Delete ONLY the images and generic audio (not CS audio) of g12 from the mediaMap before updating
Object.keys(mediaMap).forEach(key => {
    if (key.includes('g12-gen-g12') || key.startsWith('g12-u')) {
        // Keep CS audio logic intact as it is 'g12-x.y-cs-audio'
        if (!key.includes('cs-audio')) {
           // Clear it to replace with fresh scanned data
           delete mediaMap[key];
        }
    }
});

let matchedImages = 0;
let matchedAudio = 0;

// 2. Scan and match images
if (fs.existsSync(imagesDir)) {
    const images = fs.readdirSync(imagesDir).filter(f => f.startsWith('g12_') && f.match(/\.(png|jpg|jpeg|webp)$/i));
    for (const file of images) {
        // e.g. g12_u1_l1_10_flsh_act0_i0.png
        // Extract lesson num and act index
        const match = file.match(/l([\d_]+)_[a-z]+_(act\d+)_i(\d+)/i);
        if (match) {
            let lessonNumRaw = match[1]; // '1_10'
            let lessonNum = normalizeLessonNumber(lessonNumRaw); // '1.10'
            let actStr = match[2]; // 'act0'
            let idx = parseInt(match[3]);

            let key = `${lessonNum}_${actStr}`;
            let actId = activityIndexMap[key];

            if (actId) {
                initActivityInMap(actId);
                mediaMap[actId].images.push({
                    filename: file,
                    url: `/media/images/${file}`,
                    idx: idx
                });
                matchedImages++;
            } else {
               // console.log(`Warning: No activity found for image ${file} (key: ${key})`);
            }
        }
    }
}

// 3. Scan and match audio
if (fs.existsSync(audioDir)) {
    const audios = fs.readdirSync(audioDir).filter(f => f.startsWith('g12_') && f.endsWith('.mp3'));
    for (const file of audios) {
        // e.g. g12_u1_l1.10_gap_act2_a0.mp3
        const match = file.match(/l([\d.]+)_([a-z]+)_(act\d+)_a(\d+)/i);
        if (match) {
            let lessonNum = match[1]; // '1.10'
            let actPrefix = match[2]; // 'gap'
            let actStr = match[3]; // 'act2'
            let idx = parseInt(match[4]);
            
            let key = `${lessonNum}_${actStr}`;
            let actId = activityIndexMap[key];
            
            if (actId) {
                initActivityInMap(actId);
                
                // Determine audioType
                let audioType = 'word';
                if (['gap', 'srt', 'wrd'].includes(actPrefix)) audioType = 'sentence';
                else if (['lst', 'pic'].includes(actPrefix)) audioType = 'passage';
                else if (['flsh'].includes(actPrefix)) audioType = 'word';
                
                mediaMap[actId].audio.push({
                    filename: file,
                    url: `/media/audio/${file}`,
                    text: "",
                    audioType: audioType,
                    idx: idx
                });
                matchedAudio++;
            } else {
               // console.log(`Warning: No activity found for audio ${file} (key: ${key})`);
            }
        }
    }
}

// Sort the arrays properly
Object.keys(mediaMap).forEach(key => {
    if (key.includes('g12')) {
        if (mediaMap[key].images) {
            mediaMap[key].images.sort((a,b) => a.idx - b.idx);
        }
        if (mediaMap[key].audio) {
            mediaMap[key].audio.sort((a,b) => a.idx - b.idx);
        }
    }
});

fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));

console.log(`Successfully updated media_map.json with g12 media.`);
console.log(`Matched Images: ${matchedImages}`);
console.log(`Matched Audio: ${matchedAudio}`);

db.close();




