import fs from 'fs';
import path from 'path';

const directories = [
  path.resolve(process.cwd(), 'src/components/player')
];

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const match1 = /onError=\{\(e\) = loading="lazy" > \{/g;
  if (match1.test(content)) {
    content = content.replace(match1, 'onError={(e) => {\n/* eslint-disable-next-line */\n');
    changed = true;
  }

  const match2 = /\/ loading="lazy" >/g;
  if (match2.test(content)) {
    content = content.replace(match2, 'loading="lazy" />');
    changed = true;
  }

  // To properly add loading="lazy" to the top level <img without breaking JSX:
  // Just find <img elements that lack loading="lazy" and add it. We will avoid complex regex and just ensure the basic ones are handled.

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Repaired ${path.basename(filePath)}`);
  }
};

const updateDirectory = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      updateDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
};

directories.forEach(dir => updateDirectory(dir));

console.log('Dependencies repaired.');
