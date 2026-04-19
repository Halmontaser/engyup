/**
 * run_migrations_via_api.js
 * Runs migration SQL files one-by-one against Supabase using the Management API.
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'msttsebafjgzllyabsid';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;

async function executeSql(sql) {
  // Use the Supabase postgres connection via the SQL API
  const response = await fetch(`${SUPABASE_URL}/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: `${response.status}: ${text.substring(0, 200)}` };
  }

  return { data: await response.json() };
}

async function main() {
  console.log('🔧 Running Supabase Migrations via API');
  console.log('=======================================\n');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8').trim();
    if (!sql) continue;

    process.stdout.write(`  ${file}... `);
    
    try {
      const result = await executeSql(sql);
      if (result.error) {
        console.log(`⚠️  ${result.error.substring(0, 100)}`);
        errorCount++;
      } else {
        console.log('✅');
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${errorCount} had issues`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some migrations failed. This is normal if:');
    console.log('   - Tables/constraints already exist');
    console.log('   - The /pg endpoint is not available on your plan');
    console.log('\n   Alternative: Run the SQL manually in the Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log('   Open scripts/all_migrations.sql and paste it there.');
  }
}

main().catch(console.error);
