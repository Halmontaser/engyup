const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });

// 1. Check gap-fill data structures
console.log('=== GAP-FILL DATA SAMPLES ===');
const gapFills = db.prepare("SELECT id, lesson_id, data FROM activities WHERE type = 'gap-fill' LIMIT 5").all();
gapFills.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id} (lesson: ${r.lesson_id})`);
  console.log(`    sentences: ${d.sentences?.length || 0}`);
  if (d.sentences?.[0]) {
    const s = d.sentences[0];
    console.log(`    text: ${s.text?.substring(0, 80)}`);
    console.log(`    blanks/gaps/answers keys: blanks=${!!s.blanks}, gaps=${!!s.gaps}, answers=${!!s.answers}`);
    console.log(`    blanks data:`, JSON.stringify(s.blanks || s.gaps || s.answers || []).substring(0, 200));
  }
});

// 2. Check picture-description for lesson 4.6
console.log('\n=== PICTURE-DESCRIPTION for lesson 4.6 ===');
const pic46 = db.prepare("SELECT id, lesson_id, data FROM activities WHERE type = 'picture-description' AND lesson_id LIKE '%4.6%' LIMIT 2").all();
if (pic46.length === 0) {
  console.log('  No picture-description for lesson 4.6');
  const all46 = db.prepare("SELECT id, type, title FROM activities WHERE lesson_id LIKE '%4.6%'").all();
  console.log('  All activities in 4.6:', all46.map(a => `${a.type}: ${a.title}`));
} else {
  pic46.forEach(r => {
    const d = JSON.parse(r.data);
    console.log(`  ${r.id}: image="${d.image}", questions=${d.promptQuestions?.length || 0}`);
  });
}

// 3. Check picture-description image field across all
console.log('\n=== PICTURE-DESCRIPTION IMAGE FIELD ANALYSIS ===');
const allPics = db.prepare("SELECT data FROM activities WHERE type = 'picture-description' LIMIT 20").all();
let withImage = 0, withoutImage = 0, imageNeeded = 0;
allPics.forEach(r => {
  const d = JSON.parse(r.data);
  if (d.image && !d.image.includes('needed')) withImage++;
  else if (d.image && d.image.includes('needed')) imageNeeded++;
  else withoutImage++;
});
console.log(`  With image: ${withImage}, Needed: ${imageNeeded}, Without: ${withoutImage}`);

// 4. Check pronunciation-practice data
console.log('\n=== PRONUNCIATION-PRACTICE DATA ===');
const pronData = db.prepare("SELECT id, data FROM activities WHERE type = 'pronunciation-practice' LIMIT 2").all();
pronData.forEach(r => {
  const d = JSON.parse(r.data);
  console.log(`  ${r.id}: words=${d.words?.length || 0}`);
  if (d.words?.[0]) console.log(`    sample word:`, JSON.stringify(d.words[0]));
});

// 5. Check all lessons from lesson_id patterns
console.log('\n=== LESSON ID PATTERNS ===');
const idPatterns = db.prepare("SELECT lesson_id, COUNT(*) as cnt FROM activities GROUP BY lesson_id LIMIT 20").all();
console.log(idPatterns.map(r => `${r.lesson_id}: ${r.cnt}`).join('\n'));

db.close();
