const db = require('better-sqlite3')('../textbook_data.db', {readonly:true});

const rows = db.prepare(`
    SELECT l.lesson_code, u.grade_id, p.markdown_content
    FROM lessons l
    JOIN page_lessons pl ON l.id = pl.lesson_id
    JOIN pages p ON pl.page_id = p.id
    JOIN units u ON l.unit_id = u.id
    WHERE p.page_type = 'TG'
    ORDER BY u.grade_id, l.lesson_code
`).all();

let csMap = {};

for (const row of rows) {
    const lines = row.markdown_content.split('\n');
    const headerLine = lines.find(l => l.startsWith('## ') || l.startsWith('# '));
    if (headerLine) {
        // e.g., "## 1.2 WB1 / 2 CS1/2 Number FCs WS1"
        const csMatch = headerLine.match(/CS\s*([\d\/\s,]+)/i);
        if (csMatch) {
            let gradeFolder = row.grade_id; // assuming grade_id 1 is grade 7, which maps to folder 1?
            
            csMap[row.lesson_code] = {
                grade: row.grade_id,
                cs_raw: csMatch[0],
                cs_numbers: csMatch[1].trim()
            };
        }
        
        // Also look in the body for Cassette Section references
        for (const line of lines) {
            if (line.includes('Cassette Section')) {
                if (!csMap[row.lesson_code]) {
                    csMap[row.lesson_code] = { grade: row.grade_id, cs_raw: line };
                } else {
                    csMap[row.lesson_code].body_mention = line.trim();
                }
            }
        }
    }
}

console.log(`Found CS references for ${Object.keys(csMap).length} lessons.`);
console.dir(Object.entries(csMap).slice(0, 5), {depth: null});
