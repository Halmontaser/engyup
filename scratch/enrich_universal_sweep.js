const Database = require('better-sqlite3');
const db = new Database('components.db');

const updateStmt = db.prepare("UPDATE activities SET instruction = ?, data = ? WHERE id = ?");

// Fetch ALL activities in the database
const activities = db.prepare("SELECT id, type, title, instruction, data FROM activities").all();

console.log(`Starting UNIVERSAL ENRICHMENT for ${activities.length} activities...`);

db.transaction(() => {
    let updatedCount = 0;
    for (const a of activities) {
        let data = JSON.parse(a.data);
        let changed = false;
        let newInstruction = a.instruction || "";

        // --- 1. Universal Instruction Enrichment ---
        const genericPatterns = [
            { regex: /choose/i, replacement: "Challenge yourself! 📝 Select the best option for" },
            { regex: /select/i, replacement: "Let's decide! ✅ Select the correct" },
            { regex: /click/i, replacement: "Interact with the screen! 🖱️ Click to" },
            { regex: /look/i, replacement: "Use your eyes! 🧐 Look closely at the" },
            { regex: /listen/i, replacement: "Listen carefully! 🎧 Clear your ears and" },
            { regex: /read/i, replacement: "Reading time! 📖 Read carefully and" }
        ];

        // Improve generic or short instructions
        if (newInstruction.length < 35 || /choose|select|click|look|listen|read/i.test(newInstruction)) {
            // Priority: keep pedagogical context if it exists, otherwise use template
            let patternFound = false;
            for (const p of genericPatterns) {
                if (p.regex.test(newInstruction)) {
                    // Try to preserve some context if the instruction isn't JUST the verb
                    if (newInstruction.length > 15) {
                        newInstruction = newInstruction.replace(p.regex, p.replacement);
                    } else {
                        newInstruction = `${p.replacement} ${a.title || 'this task'}.`;
                    }
                    changed = true;
                    patternFound = true;
                    break;
                }
            }
            
            // Fallback for very short instructions with no pattern but need polish
            if (!patternFound && newInstruction.length < 15) {
                newInstruction = `Let's practice! 🌟 ${a.title || 'Complete this activity'}.`;
                changed = true;
            }
        }

        // --- 2. Universal Feedback Enrichment ---
        if (a.type === 'mcq' || a.type === 'true-false') {
            const options = data.options || data.choices || [];
            options.forEach(opt => {
                if (!opt.feedback) {
                    if (opt.isCorrect) {
                        opt.feedback = "Excellent! You've got it exactly right. 🌟";
                    } else {
                        opt.feedback = "Not quite. Think about the lesson and try again—you're getting closer! 💪";
                    }
                    changed = true;
                }
            });
        } else if (a.type === 'gap-fill') {
            if (!data.feedback) {
                data.feedback = "Great effort! You've successfully completed the sentences. Keep it up! 🚀";
                changed = true;
            }
        } else if (a.type === 'flashcard') {
            // Ensure audio instructions are clear
            if (!data.feedback) {
                data.feedback = "Well done! You have mastered these new words. 🏮";
                changed = true;
            }
        }

        if (changed) {
            updateStmt.run(newInstruction, JSON.stringify(data), a.id);
            updatedCount++;
        }
    }
    console.log(`Universal sweep complete. Successfully enriched ${updatedCount} activities across all grades.`);
})();

db.close();
