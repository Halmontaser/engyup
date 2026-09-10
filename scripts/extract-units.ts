import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const lineTrimmed = line.trim();
      if (!lineTrimmed || lineTrimmed.startsWith('#')) return;
      const match = lineTrimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = (process.env.VITE_SUPABASE_URL || 'https://msttsebafjgzllyabsid.supabase.co').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseKey) {
  console.error('Supabase Key is missing! Please set VITE_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractUnits() {
  const outputDir = path.join(process.cwd(), 'extracted_units');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  console.log('Fetching English course data from Supabase...');
  
  // Query all courses, modules, lessons, and activities
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select(`
      *,
      modules(
        *,
        lessons(
          *,
          activities(
            *
          )
        )
      )
    `)
    .ilike('description', '%English curriculum%');

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    process.exit(1);
  }

  if (!courses || courses.length === 0) {
    console.log('No English courses found in Supabase.');
    return;
  }

  console.log(`Found ${courses.length} courses. Processing and exporting...`);

  let fileCount = 0;

  for (const course of courses) {
    // Parse Grade number from title (e.g., "Grade 7" -> "07")
    const gradeMatch = course.title.match(/Grade\s+(\d+)/i);
    const gradeNumStr = gradeMatch ? gradeMatch[1].padStart(2, '0') : 'unknown';
    
    const modules = course.modules || [];
    
    // Sort modules by order_index
    modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

    for (const module of modules) {
      const unitNumStr = String(module.order_index || 0).padStart(2, '0');
      const filename = `grade_${gradeNumStr}_unit_${unitNumStr}.json`;
      const filePath = path.join(outputDir, filename);

      // Sort lessons in the module
      const lessons = module.lessons || [];
      lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

      for (const lesson of lessons) {
        // Sort activities in the lesson
        const activities = lesson.activities || [];
        activities.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
      }

      // Structure the data for this unit
      const unitData = {
        unit_id: module.id,
        unit_title: module.title,
        unit_number: module.order_index,
        course_id: course.id,
        course_title: course.title,
        course_description: course.description,
        lessons: lessons.map((l: any) => ({
          lesson_id: l.id,
          lesson_title: l.title,
          lesson_number: l.order_index,
          description: l.description,
          cover_image_src: l.cover_image_src,
          passing_score: l.passing_score,
          objectives: l.objectives,
          language_focus: l.language_focus,
          vocabulary: l.vocabulary,
          activities: l.activities.map((a: any) => ({
            activity_id: a.activity_id,
            activity_type: a.activity_type,
            title: a.title,
            instruction: a.instruction,
            difficulty: a.difficulty,
            book_type: a.book_type,
            book_page: a.book_page,
            compensates: a.compensates,
            order_index: a.order_index,
            is_required: a.is_required,
            xp_reward: a.xp_reward,
            time_estimate_minutes: a.time_estimate_minutes,
            content: a.content
          }))
        }))
      };

      fs.writeFileSync(filePath, JSON.stringify(unitData, null, 2), 'utf-8');
      console.log(`  Exported ${filename} (${lessons.length} lessons)`);
      fileCount++;
    }
  }

  console.log(`\nSuccess! Extracted ${fileCount} unit files into: ${outputDir}`);
}

extractUnits().catch(console.error);
