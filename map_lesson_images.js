const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database('components.db');
const destVocabDir = path.join(__dirname, 'public', 'media', 'images', 'prompts');

if (!fs.existsSync(destVocabDir)) fs.mkdirSync(destVocabDir, { recursive: true });

const mediaMapPath = path.join(__dirname, 'public', 'media', 'media_map.json');
let mediaMap = {};
if (fs.existsSync(mediaMapPath)) {
  mediaMap = JSON.parse(fs.readFileSync(mediaMapPath, 'utf8'));
}

// 1. Gather all extra images in the prompt folder
const promptSource = 'E:\\Books\\english_images\\english\\Grade 10\\images\\grade 10 lesson';

let imageFiles = [];
if (fs.existsSync(promptSource)) {
    imageFiles = fs.readdirSync(promptSource).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
}

const imageLookup = {};
imageFiles.forEach(file => {
    // some are '24_airplane_interior_pn_2_2026...png'
    // Let's strip the leading number and trailing hash
    let cleanWord = file.replace(/^[0-9]+_/, '').replace(/(_pn|_png)*_[0-9]_.*\.png$/, '.png');
    // We can also just save the base part
    let base = cleanWord.replace('.png', '').replace('.jpg', '');
    imageLookup[base] = path.join(promptSource, file);
    imageLookup[base.replace(/_/g, '')] = path.join(promptSource, file);
});

// Since mapping prompt strings to images automatically is fuzzy,
// we will just copy all these into public/media/images/prompts and map them by filename in mediaMap.
// This way they are available for use in the app.

let count = 0;
for (let key in imageLookup) {
    let sourcePath = imageLookup[key];
    let ext = path.extname(sourcePath);
    // Use the clean key for destination
    let destName = `g10_prompt_${key}${ext}`;
    let destPath = path.join(destVocabDir, destName);
    
    if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
    }
    
    mediaMap[`g10-prompt-${key}`] = `/media/images/prompts/${destName}`;
    count++;
}

fs.writeFileSync(mediaMapPath, JSON.stringify(mediaMap, null, 2));
console.log(`Copied and mapped ${count} prompt images for Grade 10.`);
