const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });

// 1. word-order: the component expects data.sentences but data has correctOrder at top level!
console.log('=== WORD-ORDER DATA STRUCTURE ===');
const woRows = db.prepare("SELECT id, data FROM activities WHERE type = 'word-order' LIMIT 5").all();
woRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}:`);
  console.log(`    has sentences: ${!!d.sentences}`);
  console.log(`    has correctOrder: ${!!d.correctOrder}, type: ${typeof d.correctOrder}, isArray: ${Array.isArray(d.correctOrder)}`);
  if (d.correctOrder) console.log(`    correctOrder sample: ${JSON.stringify(d.correctOrder).substring(0, 120)}`);
  if (d.sentences) console.log(`    sentences sample: ${JSON.stringify(d.sentences).substring(0, 120)}`);
});

// 2. transform-sentence: uses 'items' or 'prompts' but component expects 'sentences'
console.log('\n=== TRANSFORM-SENTENCE DATA STRUCTURE ===');
const tsRows = db.prepare("SELECT id, data FROM activities WHERE type = 'transform-sentence' LIMIT 5").all();
tsRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}:`);
  console.log(`    top keys: [${Object.keys(d).join(', ')}]`);
  const items = d.items || d.prompts || d.sentences || [];
  if (items.length > 0) {
    console.log(`    items count: ${items.length}`);
    console.log(`    item[0] keys: [${Object.keys(items[0]).join(', ')}]`);
    console.log(`    item[0]: ${JSON.stringify(items[0]).substring(0, 200)}`);
  }
});

// 3. gap-fill: check if the text has _____ or if it expects different placeholder format
console.log('\n=== GAP-FILL TEXT PATTERNS ===');
const gfRows = db.prepare("SELECT id, data FROM activities WHERE type = 'gap-fill' LIMIT 10").all();
let noPlaceholder = 0, hasPlaceholder = 0;
gfRows.forEach(r => {
  const d = JSON.parse(r.data);
  (d.sentences || []).forEach(s => {
    if (s.text.includes('_____') || s.text.includes('[blank]')) hasPlaceholder++;
    else noPlaceholder++;
  });
});
console.log(`  With _____ placeholder: ${hasPlaceholder}`);
console.log(`  Without placeholder (uses ___): ${noPlaceholder}`);
// Show some examples
const gfEx = db.prepare("SELECT data FROM activities WHERE type = 'gap-fill' LIMIT 3").all();
gfEx.forEach((r, i) => {
  const d = JSON.parse(r.data);
  if (d.sentences?.[0]) {
    console.log(`  Example ${i+1}: "${d.sentences[0].text.substring(0, 80)}"`);
  }
});

// 4. Check how many gap-fill text has ___ (3 underscores) vs _____ (5)
console.log('\n=== GAP-FILL UNDERSCORE PATTERNS ===');
const allGf = db.prepare("SELECT data FROM activities WHERE type = 'gap-fill' LIMIT 50").all();
let patterns = { '___': 0, '____': 0, '_____': 0, '(blank)': 0, 'parens': 0, 'none': 0 };
allGf.forEach(r => {
  const d = JSON.parse(r.data);
  (d.sentences || []).forEach(s => {
    const t = s.text;
    if (t.includes('_____')) patterns['_____']++;
    else if (t.includes('____')) patterns['____']++;
    else if (t.includes('___')) patterns['___']++;
    else if (t.includes('[blank]')) patterns['(blank)']++;
    else if (t.includes('(') && t.includes(')')) patterns['parens']++;
    else patterns['none']++;
  });
});
console.log(patterns);

// 5. reading-sequence: check if data has the 3 possible key names
console.log('\n=== READING-SEQUENCE DATA ===');
const rsRows = db.prepare("SELECT id, data FROM activities WHERE type = 'reading-sequence' LIMIT 3").all();
if (rsRows.length === 0) console.log('  NO reading-sequence activities found');
rsRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}: keys = [${Object.keys(d).join(', ')}]`);
});

// 6. image-label: check data keys
console.log('\n=== IMAGE-LABEL DATA ===');
const ilRows = db.prepare("SELECT id, data FROM activities WHERE type = 'image-label' LIMIT 3").all();
if (ilRows.length === 0) console.log('  NO image-label activities found');
ilRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}: keys = [${Object.keys(d).join(', ')}]`);
});

// 7. guessing-game: check data keys
console.log('\n=== GUESSING-GAME DATA ===');
const ggRows = db.prepare("SELECT id, data FROM activities WHERE type = 'guessing-game' LIMIT 3").all();
if (ggRows.length === 0) console.log('  NO guessing-game activities found');
ggRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}: keys = [${Object.keys(d).join(', ')}]`);
});

// 8. dialogue-read: all use 'dialogue' key, not 'lines'
console.log('\n=== DIALOGUE-READ: has comprehension? ===');
const drRows = db.prepare("SELECT id, data FROM activities WHERE type = 'dialogue-read' LIMIT 3").all();
drRows.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}: lines key=${d.lines ? 'lines' : d.dialogue ? 'dialogue' : 'NONE'}, comprehension=${d.comprehension?.length || 0}`);
});

db.close();
