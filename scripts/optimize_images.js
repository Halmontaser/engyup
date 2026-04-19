import fs from 'fs';
import path from 'path';

const directories = [
  path.resolve(process.cwd(), 'src/components/activities'),
  path.resolve(process.cwd(), 'src/components/player')
];

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Regex to match <img ... >
  // We want to add loading="lazy" if it doesn't already exist.
  const imgRegex = /<img([^>]+)>/g;
  
  content = content.replace(imgRegex, (match, attrs) => {
    // If it already has loading attr, don't modify
    if (attrs.includes('loading=')) {
      return match;
    }
    
    // Add loading="lazy" before the closing bracket
    changed = true;
    return `<img${attrs} loading="lazy" >`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Optimized ${path.basename(filePath)}`);
  }
};

const updateDirectory = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
};

console.log('Running script to inject loading="lazy" into images...');
directories.forEach(dir => updateDirectory(dir));
console.log('Done!');
