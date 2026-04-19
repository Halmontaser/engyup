const Database = require('better-sqlite3');
const db = new Database('components.db');

const updateStmt = db.prepare("UPDATE activities SET instruction = ?, data = ? WHERE id = ?");

const activities = db.prepare(`
    SELECT id, type, title, instruction, data 
    FROM activities 
    WHERE id LIKE 'g7-%' 
    AND (id LIKE '%-u3-%' OR id LIKE '%-u4-%' OR id LIKE '%-u5-%' OR id LIKE '%-u6-%' OR id LIKE '%-u7-%' OR id LIKE '%-u8-%')
`).all();

console.log(`Processing ${activities.length} activities for enriched instructions and feedback...`);

db.transaction(() => {
    let updatedCount = 0;
    for (const a of activities) {
        let data = JSON.parse(a.data);
        let changed = false;
        let newInstruction = a.instruction;

        // --- 1. Instruction Enrichment ---
        const genericPatterns = [
            { regex: /choose/i, replacement: "Take a closer look! 📝 Pick the best option for" },
            { regex: /select/i, replacement: "Let's decide! ✅ Select the correct" },
            { regex: /click/i, replacement: "Interact with the screen! 🖱️ Click to" },
            { regex: /look/i, replacement: "Use your eyes! 🧐 Look carefully at the" },
            { regex: /listen/i, replacement: "Listen closely! 🎧 Switch on your ears and" }
        ];

        if (a.instruction.length < 30 || /choose|select|click|look|listen/i.test(a.instruction)) {
            for (const p of genericPatterns) {
                if (p.regex.test(newInstruction)) {
                    newInstruction = newInstruction.replace(p.regex, p.replacement);
                    changed = true;
                    break;
                }
            }
        }

        // --- 2. Feedback Enrichment ---
        if (a.type === 'mcq' || a.type === 'true-false') {
            const options = data.options || data.choices || [];
            options.forEach(opt => {
                if (!opt.feedback) {
                    if (opt.isCorrect) {
                        opt.feedback = "Spot on! That's exactly right.";
                    } else {
                        opt.feedback = "Not quite. Think about it and try one more time! You can do it.";
                    }
                    changed = true;
                }
            });
        } else if (a.type === 'gap-fill') {
            // Add generalized feedback for gap-fills if missing
            if (!data.feedback) {
                data.feedback = "Excellent effort! You've filled in the blanks perfectly.";
                changed = true;
            }
        }

        if (changed) {
            updateStmt.run(newInstruction, JSON.stringify(data), a.id);
            updatedCount++;
        }
    }
    console.log(`Successfully enriched ${updatedCount} activities.`);
})();

db.close();
