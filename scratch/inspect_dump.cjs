const fs = require('fs');
const path = require('path');

const dumpPath = path.join(__dirname, '..', 'scripts', 'curriculum_dump.json');
console.log('Loading dump from:', dumpPath);

const data = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

console.log('Keys:', Object.keys(data));
for (const key of Object.keys(data)) {
  console.log(`${key}: ${data[key].length} items`);
  if (data[key].length > 0) {
    console.log(`  Sample ${key} keys:`, Object.keys(data[key][0]));
    console.log(`  Sample ${key} item:`, JSON.stringify(data[key][0]).substring(0, 300));
  }
}
