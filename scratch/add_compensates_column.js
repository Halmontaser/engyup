const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'components.db');
const jsonPath = 'E:/Books/english_images/clean_english_project/Grade 9/Unit 1/data/unit1_lessons_store_v4.json';

const db = new Database(dbPath);

function run() {
    try {
        console.log('Ensuring "compensates" column exists...');
        const tableInfo = db.prepare('PRAGMA table_info(activities)').all();
        const hasCompensates = tableInfo.some(col => col.name === 'compensates');
        
        if (!hasCompensates) {
            db.prepare('ALTER TABLE activities ADD COLUMN compensates TEXT').run();
            console.log('Column "compensates" added.');
        } else {
            console.log('Column "compensates" exists.');
        }

        console.log('Reading JSON store...');
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        const updateStmt = db.prepare('UPDATE activities SET compensates = ? WHERE id = ?');
        const checkStmt = db.prepare('SELECT id FROM activities WHERE id = ?');
        
        let updateCount = 0;
        let skippedCount = 0;

        db.transaction(() => {
            for (const lesson of data.lessons) {
                if (lesson.activities) {
                    for (const activity of lesson.activities) {
                        if (activity.compensates) {
                            let targetId = activity.id;
                            
                            // Try original ID
                            let exists = checkStmt.get(targetId);
                            
                            // Try with prefix if not found
                            if (!exists && !targetId.startsWith('g9-')) {
                                const prefixedId = `g9-${targetId}`;
                                exists = checkStmt.get(prefixedId);
                                if (exists) targetId = prefixedId;
                            }

                            if (exists) {
                                const result = updateStmt.run(activity.compensates, targetId);
                                if (result.changes > 0) {
                                    updateCount++;
                                }
                            } else {
                                skippedCount++;
                            }
                        }
                    }
                }
            }
        })();

        console.log(`Update complete.`);
        console.log(`Updated: ${updateCount}`);
        console.log(`Skipped (not found): ${skippedCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

run();
