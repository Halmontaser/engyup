const Database = require('better-sqlite3');
const db = new Database('components.db');

const updates = [
  {
    id: 'g10-gen-g10-u1-1.12-mcq-2',
    instruction: "Put yourself in the shoes of a reporter! 🎤 You're interviewing a rescued fisherman. Think carefully: which questions will help readers understand exactly what happened at sea?",
    feedback: {
      "How did you feel when you saw the rescue boat?": "Spot on! Emotional impact is key to a powerful rescue story.",
      "What did you have for breakfast?": "While it's a detail, it's not very relevant to the drama of the rescue.",
      "What was going through your mind as the boat went down?": "Great question! This helps the reader experience the event with the fisherman.",
      "What is the name of your boat?": "A useful fact, but not the most important part of the survival story."
    }
  },
  {
    id: 'g10-gen-g10-u1-1.13-mcq-1',
    instruction: "Let's check what you've learned! 📚 Read the sentences below and select the correct option to show you understand the story of the rescue.",
    feedback: {
      "The boat sank because of a storm.": "Correct! The weather was the main cause of the accident.",
      "The boat sank because it was old.": "Double-check the text! The story emphasizes the sudden weather change, not the boat's age."
    }
  },
  {
    id: 'g10-gen-g10-u1-1.14-mcq-2',
    instruction: "Word choice matters! ✍️ Look at the dialogue again. Which of these words best describes the fisherman's attitude toward his rescuers?",
    feedback: {
      "Grateful": "Exactly! He mentions several times how lucky he feels to be saved.",
      "Angry": "Wait, why would he be angry? He was just saved! Look for words like 'thanks' or 'helped'.",
      "Indifferent": "He seems very emotional about the event, so 'indifferent' isn't right."
    }
  }
];

const updateStmt = db.prepare("UPDATE activities SET instruction = ?, data = ? WHERE id = ?");

db.transaction(() => {
  for (const item of updates) {
    const row = db.prepare("SELECT data FROM activities WHERE id = ?").get(item.id);
    if (!row) continue;
    const data = JSON.parse(row.data);
    
    // Enrich feedback in options
    const options = data.options || data.choices || [];
    options.forEach(opt => {
      const text = opt.text || opt.answer || "";
      if (item.feedback[text]) {
        opt.feedback = item.feedback[text];
      } else if (opt.isCorrect) {
        opt.feedback = "Correct! Well done.";
      } else {
        opt.feedback = "Not quite. Try reading that section again.";
      }
    });
    
    updateStmt.run(item.instruction, JSON.stringify(data), item.id);
  }
})();

console.log(`Updated ${updates.length} activities with enriched instructions and feedback.`);
db.close();
