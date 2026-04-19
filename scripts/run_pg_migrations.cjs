/**
 * run_pg_migrations.cjs
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:sUHU95o4qyr6ozAI@db.msttsebafjgzllyabsid.supabase.co:5432/postgres';

async function main() {
  console.log('🔧 Running Supabase Migrations via PostgreSQL');
  console.log('=============================================\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  
  try {
    await client.connect();
    console.log(`✅ Connected using connectionString\n`);
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8').trim();
    if (!sql) continue;

    process.stdout.write(`  ${file}... `);
    
    try {
      await client.query(sql);
      console.log('✅');
      successCount++;
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log('⏭️  (already exists)');
        successCount++;
      } else {
        console.log(`⚠️  ${msg.substring(0, 150)}`);
        errorCount++;
      }
    }
  }

  console.log(`\n=============================================`);
  console.log(`Done: ${successCount} succeeded, ${errorCount} had issues`);
  await client.end();
}

main().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
