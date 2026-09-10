const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('partner_apps').upsert({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'LMS Yemen',
    slug: 'lms-yemen-com',
    api_key: '477afd4d9fa91981a56559485befe5ff4e3f1aaa39c649e7d9bb2057990f2e63',
    api_secret: '7caf9e1a63444ac9f47f06ef36b9ab95e96d8fa60c3f703153b74a357ea50d45',
    is_active: true,
    rate_limit_per_hour: 1000
  });
  
  if (error) {
    console.error('Error inserting:', error);
  } else {
    console.log('Successfully inserted partner app!');
  }
}
run();
