const Database = require('better-sqlite3');
const db = new Database('components.db', { readonly: true });
const lessonId = 'g7-3.15';
const lesson = db.prepare('SELECT title, description FROM lessons WHERE id = ?').get(lessonId);
const activities = db.prepare('SELECT type, title FROM activities WHERE lesson_id = ?').all(lessonId);

const textbookDb = new Database('../textbook_data.db', { readonly: true });
const page = textbookDb.prepare(`
    SELECT p.markdown_content 
    FROM pages p 
    JOIN page_lessons pl ON p.id = pl.page_id 
    WHERE pl.lesson_id = ? AND p.page_type = 'TG'
`).get(lessonId);

console.log(JSON.stringify({ lesson, activities, tgContent: page?.markdown_content }, null, 2));
db.close();
textbookDb.close();
