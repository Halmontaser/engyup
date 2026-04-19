import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log("--- SCHEMA INSPECTION ---");
  
  const tables = ['profiles', 'tenants', 'memberships', 'user_stats'];
  
  for (const table of tables) {
    console.log(`\nInspecting table: ${table}`);
    const { data: cols, error } = await supabase.rpc('run_sql', { 
      sql: `SELECT column_name, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_name = '${table}';` 
    });
    
    if (error) {
      console.error(`Error inspecting ${table}:`, error.message);
      continue;
    }
    
    console.table(cols);
  }
}

inspect();
