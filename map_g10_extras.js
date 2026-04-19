const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('components.db');
const destVocabDir = path.join(__dirname, 'public', 'media', 'images', 'vocab');
const destPromptDir = path.join(__dirname, 'public', 'media', 'images', 'prompts');

if (!fs.existsSync(destVocabDir)) fs.mkdirSync(destVocabDir, { recursive: true });
if (!fs.existsSync(destPromptDir)) fs.mkdirSync(destPromptDir, { recursive: true });

const mediaMapPath = path.join(__dirname, 'public', 'media', 'media_map.json');
let mediaMap = {};
if (fs.existsSync(mediaMapPath)) {
  mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));
}

// 1. Gather all extra images
const vocabSource1 = 'E:\\Books\\english_images\\english\\vocabulary_images\\grade_10';
const vocabSource2 = 'E:\\Books\\english_images\\english\\Grade 10\\images';

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (let file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, fileList);
    } else {
      if (fullPath.endsWith('.png') || fullPath.endsWith('.jpg')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allExtraImages = [...getFiles(vocabSource1), ...getFiles(vocabSource2)];

const imageLookup = {};
allExtraImages.forEach(imgPath => {
    let basename = path.basename(imgPath, path.extname(imgPath)).toLowerCase();
    imageLookup[basename] = imgPath;
    
    let cleanWord = basename;
    
    // If it's a generated prompt filename like "107_Accept__A_person_...png"
    if (basename.includes('__')) {
       cleanWord = basename.replace(/^[0-9]+_/, '').split('__')[0];
    }
    
    cleanWord = cleanWord.replace(/[^a-z0-9]/g, '');
    
    if (cleanWord.length > 2 && !imageLookup[cleanWord]) {
      // Allow exact alphanumeric match, e.g. "trafficlights"
      imageLookup[cleanWord] = imgPath;
    }
});

let updatedCount = 0;
let matchedFiles = new Set();

// 2. Process Flashcards G10
const flashcards = db.prepare(`SELECT id, data FROM activities WHERE type='flashcard' AND id LIKE 'g10%'`).all();
const updateActivity = db.prepare(`UPDATE activities SET data = ? WHERE id = ?`);

flashcards.forEach(fc => {
  let data = JSON.parse(fc.data);
  let changed = false;
  if (data.cards) {
    data.cards.forEach(item => {
      let w = (item.word || '').toLowerCase();
      let lookupKey = w.replace(/[^a-z0-9]/g, ''); // alphanumeric only
      
      let foundPath = imageLookup[w] || imageLookup[w.replace(/\s+/g, '_')] || imageLookup[lookupKey];
      if (foundPath) {
        let ext = path.extname(foundPath);
        let newImgName = `g10_vocab_${lookupKey}${ext}`;
        let destPath = path.join(destVocabDir, newImgName);
        if (!fs.existsSync(destPath)) {
           fs.copyFileSync(foundPath, destPath);
        }
        
        let mediaId = `g10-vocab-${lookupKey}`;
        mediaMap[mediaId] = `/media/images/vocab/${newImgName}`;
        item.image = mediaId;
        changed = true;
        matchedFiles.add(foundPath);
      }
    });
  }
  
  if (changed) {
    updateActivity.run(JSON.stringify(data), fc.id);
    updatedCount++;
  }
});

fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));
console.log(`Updated ${updatedCount} flashcard activities with vocab images.`);
console.log(`Matched ${matchedFiles.size} unique vocabulary images.`);
