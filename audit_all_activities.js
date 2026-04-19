const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: true });

const types = db.prepare("SELECT DISTINCT type FROM activities ORDER BY type").all().map(r => r.type);

console.log(`\n=== FULL ACTIVITY AUDIT (${types.length} types) ===\n`);

for (const type of types) {
  const rows = db.prepare("SELECT id, data FROM activities WHERE type = ? LIMIT 3").all(type);
  console.log(`\n─── ${type} (${rows.length} samples) ───`);
  
  for (const row of rows) {
    try {
      const d = JSON.parse(row.data);
      const topKeys = Object.keys(d);
      console.log(`  ${row.id}`);
      console.log(`    top keys: [${topKeys.join(', ')}]`);
      
      // Check specific data structure issues per type
      switch(type) {
        case 'gap-fill': {
          const s = d.sentences || [];
          console.log(`    sentences: ${s.length}`);
          if (s[0]) {
            const hasPlaceholder = s[0].text?.includes('_____') || s[0].text?.includes('[blank]');
            console.log(`    has placeholder in text: ${hasPlaceholder}`);
            console.log(`    blank keys: blanks=${!!s[0].blanks} gaps=${!!s[0].gaps} answers=${!!s[0].answers}`);
            if (s[0].blanks) console.log(`    blanks count: ${s[0].blanks.length}`);
          }
          break;
        }
        case 'category-sort': {
          const cats = d.categories || [];
          console.log(`    categories: ${cats.length}`);
          cats.forEach(c => console.log(`      "${c.name}": ${c.items?.length || 0} items`));
          break;
        }
        case 'match-pairs': {
          const pairs = d.pairs || [];
          console.log(`    pairs: ${pairs.length}`);
          if (pairs[0]) console.log(`    sample: left="${pairs[0].left}", right="${pairs[0].right}"`);
          break;
        }
        case 'word-order': {
          const sents = d.sentences || [];
          console.log(`    sentences: ${sents.length}`);
          if (sents[0]) {
            console.log(`    keys: [${Object.keys(sents[0]).join(', ')}]`);
            console.log(`    correctOrder type: ${typeof sents[0].correctOrder}, isArray: ${Array.isArray(sents[0].correctOrder)}`);
            console.log(`    has answer: ${!!sents[0].answer}, has sentence: ${!!sents[0].sentence}`);
          }
          break;
        }
        case 'picture-description': {
          console.log(`    image: "${d.image}"`);
          console.log(`    promptQuestions: ${d.promptQuestions?.length || 0}`);
          console.log(`    sampleAnswers: ${d.sampleAnswers?.length || 0}`);
          console.log(`    keywords: ${d.keywords?.length || 0}`);
          break;
        }
        case 'pronunciation-practice': {
          const words = d.words || [];
          console.log(`    words: ${words.length}`);
          if (words[0]) {
            console.log(`    sample: word="${words[0].word}", phonetic="${words[0].phonetic}", audioSrc="${words[0].audioSrc}"`);
            console.log(`    has syllables: ${!!words[0].syllables}, count: ${words[0].syllables?.length || 0}`);
          }
          break;
        }
        case 'listening-comprehension': {
          console.log(`    transcript length: ${d.transcript?.length || 0}`);
          console.log(`    questions: ${d.questions?.length || 0}`);
          if (d.questions?.[0]) {
            console.log(`    q[0].options: ${d.questions[0].options?.length || 0}`);
            if (d.questions[0].options?.[0]) {
              console.log(`    option keys: [${Object.keys(d.questions[0].options[0]).join(', ')}]`);
            }
          }
          break;
        }
        case 'flashcard': {
          const items = d.items || d.cards || [];
          console.log(`    items: ${items.length} (key used: ${d.items ? 'items' : d.cards ? 'cards' : 'NONE'})`);
          if (items[0]) {
            console.log(`    item keys: [${Object.keys(items[0]).join(', ')}]`);
          }
          break;
        }
        case 'mcq': {
          const qs = d.questions || [];
          console.log(`    questions: ${qs.length}`);
          if (qs[0]) {
            console.log(`    option type: ${typeof qs[0].options?.[0]}`);
            console.log(`    has answer field: ${!!qs[0].answer}`);
          }
          break;
        }
        case 'true-false': {
          const stmts = d.statements || [];
          console.log(`    statements: ${stmts.length}`);
          if (stmts[0]) console.log(`    keys: [${Object.keys(stmts[0]).join(', ')}]`);
          break;
        }
        case 'dictation': {
          const sents = d.sentences || [];
          console.log(`    sentences: ${sents.length}`);
          if (sents[0]) console.log(`    keys: [${Object.keys(sents[0]).join(', ')}]`);
          break;
        }
        case 'spelling-bee': {
          const words = d.words || [];
          console.log(`    words: ${words.length}`);
          if (words[0]) {
            console.log(`    keys: [${Object.keys(words[0]).join(', ')}]`);
            console.log(`    scrambled type: ${typeof words[0].scrambled}, isArray: ${Array.isArray(words[0].scrambled)}`);
          }
          break;
        }
        case 'dialogue-read': {
          const lines = d.lines || d.dialogue || [];
          console.log(`    lines: ${lines.length} (key: ${d.lines ? 'lines' : d.dialogue ? 'dialogue' : 'NONE'})`);
          if (lines[0]) console.log(`    line keys: [${Object.keys(lines[0]).join(', ')}]`);
          console.log(`    wordBank: ${d.wordBank?.length || 0}`);
          break;
        }
        case 'conversation-sim': {
          console.log(`    scenario: "${d.scenario?.substring(0, 60)}..."`);
          console.log(`    turns: ${d.turns?.length || 0}`);
          if (d.turns?.[0]) {
            console.log(`    turn[0] keys: [${Object.keys(d.turns[0]).join(', ')}]`);
            console.log(`    has studentOptions: ${!!d.turns[0].studentOptions}`);
          }
          break;
        }
        case 'reading-passage': {
          console.log(`    passage length: ${(d.passage || d.text || '').length}`);
          console.log(`    has title: ${!!d.title}`);
          console.log(`    highlightWords: ${d.highlightWords?.length || 0}`);
          console.log(`    questions: ${d.questions?.length || 0}`);
          break;
        }
        default:
          console.log(`    (generic keys: [${topKeys.join(', ')}])`);
      }
    } catch(e) {
      console.log(`  ${row.id}: ERROR parsing JSON: ${e.message}`);
    }
  }
}

// Also check for any types NOT handled in ActivityPlayer
const handledTypes = [
  'flashcard', 'mcq', 'gap-fill', 'true-false', 'match-pairs', 'word-order',
  'reading-passage', 'category-sort', 'dialogue-read', 'transform-sentence',
  'image-label', 'guessing-game', 'reading-sequence', 'sentence-builder',
  'word-association', 'pronunciation-practice', 'listening-comprehension',
  'spelling-bee', 'dictation', 'conversation-sim', 'picture-description'
];
const unhandled = types.filter(t => !handledTypes.includes(t));
console.log(`\n=== UNHANDLED ACTIVITY TYPES: ${unhandled.length === 0 ? 'None!' : unhandled.join(', ')} ===`);

db.close();
