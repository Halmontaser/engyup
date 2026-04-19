import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: courses, error: cErr } = await supabase.from('courses').select('id, title');
  const { count: activities, error: aErr } = await supabase.from('activities').select('*', { count: 'exact', head: true });
  
  if (cErr) console.error('Courses Error:', cErr.message);
  else {
    console.log('Courses in DB:');
    courses.forEach(c => console.log(` - ${c.title} (${c.id})`));
  }
  
  if (aErr) console.error('Activities Error:', aErr.message);
  else console.log('Total Activities:', activities);
}

check();
