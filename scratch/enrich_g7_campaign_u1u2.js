const Database = require('better-sqlite3');
const db = new Database('components.db');

const updates = [
    // Unit 1
    {
        id: 'g7-gen-g7-u1-1.3-true-false-1',
        instruction: "Look closely at the scene! 🧐 Read the sentence and decide if it matches what you see. Is it True or False?",
        feedback: {
            "True": "Correct! You have a sharp eye for detail.",
            "False": "Not quite. Take another look at the picture—the answer is right there!"
        }
    },
    {
        id: 'g7-gen-g7-u1-1.4-match-pairs-1',
        instruction: "Matching time! 🧩 Match the Arabic words with their English meanings. This is a great way to build your vocabulary!",
        feedback: "Awesome matching! You're building a strong English vocabulary."
    },
    {
        id: 'g7-gen-g7-u1-1.5-mcq-1',
        instruction: "Time to choose! 📝 Choose the best response for each greeting. Think about what we say when we first meet someone.",
        feedback: {
            "Hello!": "Perfect! This is the most common way to say hi.",
            "Goodbye": "Oops! We say this when we're leaving, not when we're meeting.",
            "Yes": "This is an answer, but not really a greeting. Try 'Hello'!"
        }
    },
    {
        id: 'g7-gen-g7-u1-1.7-flashcard-1',
        instruction: "Meet Fuad and his friends! 👬 Look at the pictures and listen to their names. Try to remember who is who!",
        feedback: "Great! You're getting to know the characters in our book."
    },
    {
        id: 'g7-gen-g7-u2-2.1-mcq-1',
        instruction: "Who is it? 👤 Read the description and choose the correct name from the picture. Pay attention to what they are wearing!",
        feedback: {
            "Fuad": "Correct! That's Fuad in the blue shirt.",
            "Ahmed": "Wait! Look at the names in the picture again. Ahmed is wearing a different color.",
            "Zaid": "Not quite. Check the labels one more time."
        }
    },
    {
        id: 'g7-gen-g7-u2-2.3-gap-fill-1',
        instruction: "Filling the gaps! ✍️ Complete the sentences about the school items. Use the words from the box.",
        feedback: "Well done! You correctly identified all the classroom supplies."
    },
    {
        id: 'g7-gen-g7-u2-2.9-picture-description-1',
        instruction: "Let's talk about the picture! 🖼️ Look at the people and their hobbies. Answer the questions about what each person 'has got'. Can you say your answers out loud too? 🎙️",
        feedback: "Excellent! You're using 'has got' and 'have got' perfectly to describe what people own."
    }
    // ... I will continue to auto-generate for more later in the transaction
];

// Re-using the logic from previous scripts but applying it to the full U1-U2 batch
const updateStmt = db.prepare("UPDATE activities SET instruction = ?, data = ? WHERE id = ?");

db.transaction(() => {
    // 1. Manual premium updates
    for (const item of updates) {
        const row = db.prepare("SELECT data FROM activities WHERE id = ?").get(item.id);
        if (!row) continue;
        let data = JSON.parse(row.data);
        if (typeof item.feedback === 'string') {
            data.feedback = item.feedback;
        } else if (typeof item.feedback === 'object') {
            const options = data.options || data.choices || [];
            options.forEach(opt => {
                const text = opt.text || opt.answer || "";
                if (item.feedback[text]) opt.feedback = item.feedback[text];
                else if (opt.isCorrect) opt.feedback = "Correct! Well done.";
                else opt.feedback = "Not quite. Try again!";
            });
        }
        updateStmt.run(item.instruction, JSON.stringify(data), item.id);
    }

    // 2. Automated rule-based updates for the rest of U1-U2 in G7
    const remaining = db.prepare("SELECT id, type, title, instruction, data FROM activities WHERE id LIKE 'g7-%' AND (id LIKE '%-u1-%' OR id LIKE '%-u2-%')").all();
    for (const a of remaining) {
        if (updates.some(u => u.id === a.id)) continue; // Skip already manual updated

        let newInstruction = a.instruction;
        let changed = false;

        // Apply rules
        if (a.type === 'flashcard' && a.instruction.includes('Look')) {
            newInstruction = `Let's learn new words! 📚 ${a.title}. Look at the picture and listen to the pronunciation.`;
            changed = true;
        } else if (a.type === 'mcq' && a.instruction.includes('Choose')) {
            newInstruction = `Time for a quick check! ✅ ${a.instruction.replace(/Choose/i, 'Choose the best answer for')}`;
            changed = true;
        } else if (a.type === 'word-order') {
            newInstruction = `Sentence Puzzle! 🧩 Put the words in the right order to build a perfect sentence.`;
            changed = true;
        } else if (a.type === 'pronunciation-practice') {
            newInstruction = `Your turn to speak! 🎤 Listen to the word, then record your own voice. Try to match the sound!`;
            changed = true;
        }

        if (changed) {
            updateStmt.run(newInstruction, a.data, a.id);
        }
    }
})();

console.log(`Successfully scaled Grade 7 Units 1 & 2 enrichment.`);
db.close();
