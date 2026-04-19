const Database = require('better-sqlite3');
const db = new Database('components.db');

const updates = [
  {
    id: 'g7-gen-g7-u1-1.1-image-label-1',
    instruction: "Welcome to your first English classroom! 🎒 Look at the labels and the picture. Can you help Fuad label his school supplies?",
    feedback: "Great job! You're learning the names of things you see every day."
  },
  {
    id: 'g7-gen-g7-u1-1.2-match-pairs-1',
    instruction: "Time to say hello! 👋 Match the greetings to the pictures that show people meeting each other.",
    feedback: "Excellent! You know how to greet people in English now."
  },
  {
    id: 'g7-gen-g7-u2-2.2-pronunciation-practice-1',
    instruction: "Let's practice speaking! 🎤 Listen to the teacher's voice, then try to say the word just like them. Don't worry, you can try as many times as you like!",
    feedback: "Fantastic pronunciation! Keep practicing each word."
  },
  {
    id: 'g7-gen-g7-u1-1.3-true-false-1',
    instruction: "True or False? 🧐 Look at the picture of the classroom. Read the sentence and decide if it is correct or not.",
    feedback: {
      "True": "Correct! The picture clearly shows this.",
      "False": "Oops! Take another look at the picture—you'll see the answer there."
    }
  },
  {
    id: 'g7-gen-g7-u1-1.5-mcq-1',
    instruction: "Choosing the right word! 📝 Read the question about greetings and pick the best response. Which one would you say to a friend?",
    feedback: {
      "Hello!": "Perfect! This is a very friendly and common greeting.",
      "Goodbye": "Wait! This is used when leaving, not when meeting someone.",
      "Yes": "This is a simple answer, but it's not a greeting."
    }
  }
];

const updateStmt = db.prepare("UPDATE activities SET instruction = ?, data = ? WHERE id = ?");

db.transaction(() => {
  for (const item of updates) {
    const row = db.prepare("SELECT data FROM activities WHERE id = ?").get(item.id);
    if (!row) continue;
    let data = JSON.parse(row.data);
    
    // Add overall feedback if it's a string, or option-specific if it's an object
    if (typeof item.feedback === 'string') {
        data.feedback = item.feedback;
    } else if (typeof item.feedback === 'object') {
        const options = data.options || data.choices || [];
        options.forEach(opt => {
            const text = opt.text || opt.answer || "";
            if (item.feedback[text]) {
                opt.feedback = item.feedback[text];
            } else if (opt.isCorrect) {
                opt.feedback = "Correct! Well done.";
            } else {
                opt.feedback = "Not quite. Try again!";
            }
        });
    }
    
    updateStmt.run(item.instruction, JSON.stringify(data), item.id);
  }
})();

console.log(`Updated Grade 7 activities with conversational instructions and feedback.`);
db.close();
