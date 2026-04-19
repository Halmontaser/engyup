const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(__dirname, '..', 'components.db');
const db = new Database(dbPath);

// Helper to find all store_v4.json files
function findJsonFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const basename = path.basename(file);
        if (basename.startsWith('.') || basename === 'node_modules') return;
        
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findJsonFiles(file));
        } else if (file.endsWith('_lessons_store_v4.json')) {
            results.push(file);
        }
    });
    return results;
}

function runSync() {
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

        const rootDir = 'E:/Books/english_images/clean_english_project';
        console.log(`Searching for JSON files in ${rootDir}...`);
        const jsonFiles = findJsonFiles(rootDir);
        console.log(`Found ${jsonFiles.length} unit store files.`);

        const updateStmt = db.prepare('UPDATE activities SET compensates = ? WHERE id = ?');
        const checkStmt = db.prepare('SELECT id FROM activities WHERE id = ?');
        
        let totalUpdated = 0;
        let totalSkipped = 0;

        for (const jsonPath of jsonFiles) {
            console.log(`Processing: ${path.basename(jsonPath)}`);
            const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const grade = data.meta ? data.meta.grade : null;
            
            let fileUpdated = 0;
            let fileSkipped = 0;

            db.transaction(() => {
                for (const lesson of data.lessons) {
                    if (lesson.activities) {
                        for (const activity of lesson.activities) {
                            if (activity.compensates) {
                                let targetId = activity.id;
                                
                                // Try original ID
                                let exists = checkStmt.get(targetId);
                                
                                // Try with grade prefix if not found and we have a grade
                                if (!exists && grade && !targetId.startsWith(`g${grade}-`)) {
                                    const prefixedId = `g${grade}-${targetId}`;
                                    exists = checkStmt.get(prefixedId);
                                    if (exists) targetId = prefixedId;
                                }

                                if (exists) {
                                    const result = updateStmt.run(activity.compensates, targetId);
                                    if (result.changes > 0) {
                                        fileUpdated++;
                                    }
                                } else {
                                    fileSkipped++;
                                }
                            }
                        }
                    }
                }
            })();
            
            console.log(`  -> Updated: ${fileUpdated}, Skipped: ${fileSkipped}`);
            totalUpdated += fileUpdated;
            totalSkipped += fileSkipped;
        }

        console.log('\nBulk Sync Complete.');
        console.log(`Total Updated: ${totalUpdated}`);
        console.log(`Total Skipped: ${totalSkipped}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

runSync();
