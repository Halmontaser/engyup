const Database = require('better-sqlite3');
const db = new Database('components.db');

// Grade 8 Unit 4 Lesson 6
const g8_pd_id = 'g8-gen-g8-u4-4.6-picture-description-1';
const row8_pd = db.prepare('SELECT data FROM activities WHERE id = ?').get(g8_pd_id);
if (row8_pd) {
    let data = JSON.parse(row8_pd.data);
    data.image = '/media/images/g8_u4_l4_6_pic_act7_i0.png';
    db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), g8_pd_id);
    console.log('Updated G8 Picture Description');
}

const g8_fl_id = 'g8-gen-g8-u4-4.6-flashcard-1';
const row8_fl = db.prepare('SELECT data FROM activities WHERE id = ?').get(g8_fl_id);
if (row8_fl) {
    let data = JSON.parse(row8_fl.data);
    data.cards.forEach((card, idx) => {
        if (card.image === '252' || card.image === 'needed') {
            // Mapping based on index if relevant, or just first few
            if (idx === 0) card.image = '/media/images/g8_u4_l4_6_flsh_act0_i0.png'; // turn left
            if (idx === 1) card.image = '/media/images/g8_u4_l4_6_flsh_act0_i1.png'; // turn right
            if (idx === 2) card.image = '/media/images/g8_u4_l4_6_flsh_act0_i2.png'; // go straight on
        }
    });
    db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), g8_fl_id);
    console.log('Updated G8 Flashcards');
}

// Grade 9 Unit 4 Lesson 4.6
const g9_mcq_id = 'g9-gen-g9-u4-4.6-mcq-1';
const row9_mcq = db.prepare('SELECT data FROM activities WHERE id = ?').get(g9_mcq_id);
if (row9_mcq) {
    let data = JSON.parse(row9_mcq.data);
    data.questions.forEach(q => {
        if (q.image === '1376') q.image = '/media/images/g9_u4_l4_6_mcq_act1_i0.png';
    });
    db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), g9_mcq_id);
    console.log('Updated G9 MCQ');
}

const g9_pd_id = 'g9-gen-g9-u4-4.6-picture-description-1';
const row9_pd = db.prepare('SELECT data FROM activities WHERE id = ?').get(g9_pd_id);
if (row9_pd) {
    let data = JSON.parse(row9_pd.data);
    if (data.image === '1377') data.image = '/media/images/g9_u4_l4_6_gap_act2_i0.png';
    db.prepare('UPDATE activities SET data = ? WHERE id = ?').run(JSON.stringify(data), g9_pd_id);
    console.log('Updated G9 Picture Description');
}
