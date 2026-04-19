const Database = require('better-sqlite3');
const db = new Database('components.db');

const lessons = db.prepare(`
  SELECT l.id, l.title, g.grade_number, u.unit_number, l.lesson_number 
  FROM lessons l 
  JOIN units u ON l.unit_id = u.id 
  JOIN grades g ON u.grade_id = g.id 
  WHERE u.unit_number = 4 AND l.lesson_number = 6
`).all();

console.log('Lessons matching 4.6:');
console.log(JSON.stringify(lessons, null, 2));

for (const lesson of lessons) {
  const activities = db.prepare('SELECT * FROM activities WHERE lesson_id = ?').all(lesson.id);
  console.log(`\nActivities for Lesson ID ${lesson.id} (Grade ${lesson.grade_number} Unit ${lesson.unit_number} Lesson ${lesson.lesson_number}):`);
  activities.forEach(a => {
    console.log(`- Type: ${a.type}, Title: ${a.title}`);
    const data = JSON.parse(a.data);
    if (data.image || data.imageUrl || data.image_src) {
        console.log(`  Data Image: ${data.image || data.imageUrl || data.image_src}`);
    }
  });
}
