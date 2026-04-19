/**
 * migrate_data.js — Uploads curriculum_dump.json into Supabase.
 * Usage: node scripts/migrate_data.js
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DUMP_PATH = path.join(__dirname, 'curriculum_dump.json');
const BATCH_SIZE = 50;

async function main() {
  console.log('🌙 Crescent → Supabase Migration (JSON mode)');
  console.log('=============================================');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const dump = JSON.parse(readFileSync(DUMP_PATH, 'utf-8'));

  console.log(`Source: ${dump.grades.length} grades, ${dump.units.length} units, ${dump.lessons.length} lessons, ${dump.activities.length} activities\n`);

  // 1. Get or create tenant
  let { data: tenant } = await supabase.from('tenants').select('*').eq('slug', 'general').maybeSingle();
  if (!tenant) {
    const { data, error } = await supabase.from('tenants').insert([{ name: 'Crescent English', slug: 'general' }]).select().single();
    if (error) throw new Error('Tenant creation failed: ' + error.message);
    tenant = data;
  }
  console.log(`Tenant: ${tenant.name} (${tenant.id})\n`);

  const gradeIdMap = {};
  const unitIdMap = {};
  const lessonIdMap = {};

  // 2. Grades → Courses
  console.log('Migrating grades → courses...');
  for (const g of dump.grades) {
    const id = randomUUID();
    gradeIdMap[g.id] = id;
    const { error } = await supabase.from('courses').insert([{
      id, tenant_id: tenant.id,
      title: g.label || `Grade ${g.grade_number}`,
      description: `English curriculum for Grade ${g.grade_number}`,
      is_global: false,
    }]);
    if (error) console.log(`  ⚠️ ${g.label}: ${error.message}`);
    else console.log(`  ✅ ${g.label || 'Grade ' + g.grade_number}`);
  }

  // 3. Units → Modules
  console.log('\nMigrating units → modules...');
  for (const u of dump.units) {
    const id = randomUUID();
    unitIdMap[u.id] = id;
    const courseId = gradeIdMap[u.grade_id];
    if (!courseId) continue;
    const { error } = await supabase.from('modules').insert([{
      id, course_id: courseId,
      title: u.title || `Unit ${u.unit_number}`,
      order_index: u.unit_number,
    }]);
    if (error) console.log(`  ⚠️ ${u.title}: ${error.message}`);
  }
  console.log(`  ✅ ${Object.keys(unitIdMap).length} modules`);

  // 4. Lessons (batched)
  console.log('\nMigrating lessons...');
  let lessonCount = 0;
  const lessonRows = [];
  for (const l of dump.lessons) {
    const moduleId = unitIdMap[l.unit_id];
    if (!moduleId) continue;
    const id = randomUUID();
    lessonIdMap[l.id] = id;
    lessonRows.push({
      id, module_id: moduleId,
      title: l.title || `Lesson ${l.lesson_number}`,
      order_index: l.lesson_number || 0,
      description: l.description || null,
      cover_image_src: l.cover_image_src || null,
      passing_score: l.passing_score || 70,
      objectives: safeParse(l.objectives),
      language_focus: safeParse(l.language_focus),
      vocabulary: safeParse(l.vocabulary),
    });
  }
  for (let i = 0; i < lessonRows.length; i += BATCH_SIZE) {
    const batch = lessonRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('lessons').insert(batch);
    if (error) console.log(`  ⚠️ batch ${i}: ${error.message}`);
    else lessonCount += batch.length;
  }
  console.log(`  ✅ ${lessonCount} lessons`);

  // 5. Activities (batched)
  console.log('\nMigrating activities...');
  let activityCount = 0;
  const actRows = [];
  for (const a of dump.activities) {
    const lessonId = lessonIdMap[a.lesson_id];
    if (!lessonId) continue;
    actRows.push({
      activity_id: randomUUID(),
      lesson_id: lessonId,
      activity_type: a.type,
      content: safeParse(a.data),
      order_index: a.sort_order || 0,
      title: a.title || null,
      instruction: a.instruction || null,
      difficulty: a.difficulty || null,
      book_type: a.book_type || null,
      book_page: a.book_page || null,
      compensates: a.compensates || null,
      is_required: true,
      xp_reward: 10,
    });
  }
  for (let i = 0; i < actRows.length; i += BATCH_SIZE) {
    const batch = actRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('activities').insert(batch);
    if (error) {
      // Fallback: insert one by one
      for (const item of batch) {
        const { error: e2 } = await supabase.from('activities').insert([item]);
        if (e2) console.log(`    ❌ [${item.activity_type}]: ${e2.message}`);
        else activityCount++;
      }
    } else {
      activityCount += batch.length;
    }
    if (i > 0 && i % 500 === 0) console.log(`  ... ${i}/${actRows.length}`);
  }
  console.log(`  ✅ ${activityCount} activities`);

  // Summary
  console.log('\n=============================================');
  console.log('🎉 Migration Complete!');
  console.log(`   Courses:    ${Object.keys(gradeIdMap).length}`);
  console.log(`   Modules:    ${Object.keys(unitIdMap).length}`);
  console.log(`   Lessons:    ${lessonCount}`);
  console.log(`   Activities: ${activityCount}`);

  writeFileSync(path.join(__dirname, '..', 'migration_id_mapping.json'),
    JSON.stringify({ gradeIdMap, unitIdMap, lessonIdMap, timestamp: new Date().toISOString() }, null, 2));
  console.log('   💾 ID mapping saved');
}

function safeParse(v) {
  if (!v) return null;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return v; }
}

main().catch(err => { console.error('❌', err); process.exit(1); });
