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
  console.error(`URL: ${supabaseUrl}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Activity {
  activity_id: string;
  lesson_id: string;
  activity_type: string;
  title: string;
  instruction: string | null;
  content: any;
  compensates: boolean | null;
  order_index: number;
  difficulty: string | null;
  book_type: string | null;
  book_page: string | null;
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  description: string | null;
  activities: Activity[];
}

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  modules: Module[];
}

interface ExportData {
  courses: Course[];
  exported_at: string;
}

async function exportEnglishActivities() {
  console.log('Fetching English courses...');

  // Fetch all English courses with full hierarchy
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select(`
      id, title, description,
      modules(
        id, title, order_index,
        lessons(
          id, title, order_index, description,
          activities(
            activity_id, lesson_id, activity_type, title, instruction, content,
            compensates, order_index, difficulty, book_type, book_page
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
    console.log('No English courses found.');
    return;
  }

  console.log(`Found ${courses.length} English courses:`);
  courses.forEach((course: Course) => {
    console.log(`  - ${course.title}: ${course.modules.length} modules`);
    let totalActivities = 0;
    course.modules.forEach((module: Module) => {
      module.lessons.forEach((lesson: Lesson) => {
        totalActivities += lesson.activities.length;
      });
    });
    console.log(`    Total activities: ${totalActivities}`);
  });

  const exportData: ExportData = {
    courses,
    exported_at: new Date().toISOString()
  };

  // Write to JSON file
  const outputPath = 'english-activities-export.json';
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`\nExport complete! Data saved to: ${outputPath}`);
}

// Run the export
exportEnglishActivities().catch(console.error);