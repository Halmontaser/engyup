const Database = require('better-sqlite3');
const db = new Database('./components.db', { readonly: false });

const rows = db.prepare("SELECT id, type, data FROM activities WHERE lesson_id LIKE 'g11%'").all();

let updateCount = 0;

db.transaction(() => {
    for (const row of rows) {
        let data = JSON.parse(row.data);
        let changed = false;

        // transform-sentence: items -> sentences
        if (row.type === 'transform-sentence' && data.items && !data.sentences) {
            data.sentences = data.items;
            delete data.items;
            changed = true;
        }

        // match-pairs: items -> pairs
        if (row.type === 'match-pairs' && data.items && !data.pairs) {
            data.pairs = data.items;
            delete data.items;
            changed = true;
        }

        // word-order: items -> sentences
        if (row.type === 'word-order' && data.items && !data.sentences) {
            data.sentences = data.items;
            delete data.items;
            changed = true;
        }

        // gap-fill: items/gaps -> sentences
        if (row.type === 'gap-fill') {
            if (data.items && !data.sentences) {
                data.sentences = data.items;
                delete data.items;
                changed = true;
            } else if (data.gaps && !data.sentences) {
                data.sentences = data.gaps;
                delete data.gaps;
                changed = true;
            }
        }

        // flashcard: items -> cards
        if (row.type === 'flashcard' && data.items && !data.cards) {
            data.cards = data.items;
            delete data.items;
            changed = true;
        }
        
        // picture-description: requires an image field, even if empty string
        if (row.type === 'picture-description' && data.image === undefined) {
            data.image = "";
            changed = true;
        }

        if (changed) {
            db.prepare("UPDATE activities SET data = ? WHERE id = ?").run(JSON.stringify(data), row.id);
            updateCount++;
        }
    }
})();

console.log(`Successfully normalized ${updateCount} Grade 10 activities.`);
db.close();


