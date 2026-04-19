const { Client } = require('pg');
const regions = ['us-east-1', 'us-west-1', 'us-east-2', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1', 'ap-southeast-2', 'sa-east-1', 'ca-central-1', 'ap-south-1'];
const pw = 'sUHU95o4qyr6ozAI';
const ref = 'msttsebafjgzllyabsid';
async function test() {
  for (let r of regions) {
    const cs = `postgresql://postgres.${ref}:${pw}@aws-0-${r}.pooler.supabase.com:6543/postgres`;
    const c = new Client({connectionString: cs, ssl:{rejectUnauthorized:false}});
    try {
      console.log('Testing', r);
      await c.connect();
      console.log('SUCCESS:', r);
      await c.end();
      return;
    } catch(e) {
      if (e.code === 'ENOTFOUND') continue;
      console.log('Error for', r, e.message);
    }
  }
  console.log('Done testing.');
}
test();
