import fs from 'fs';
import path from 'path';

const activitiesDir = path.resolve(process.cwd(), 'src/components/player');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Ensure getMediaUrl is imported inside the file
  if (!content.includes('import { getMediaUrl } from "@/utils/assets";') && 
      !content.includes('import { getMediaUrl } from "../../utils/assets";') &&
      !content.includes('import { getMediaUrl } from \'@/utils/assets\';')) {
    
    // Find the last import statement or beginning of file
    const importMatch = content.lastIndexOf('import ');
    if (importMatch !== -1) {
      const endOfImport = content.indexOf('\n', importMatch);
      content = content.slice(0, endOfImport + 1) + 
                'import { getMediaUrl } from "@/utils/assets";\n' + 
                content.slice(endOfImport + 1);
      changed = true;
    }
  }

  // Regex for new Audio(...)
  // We want to wrap the variable in getMediaUrl()
  const audioRegex = /new Audio\((?!getMediaUrl)(.*?)\)/g;
  if (audioRegex.test(content)) {
    content = content.replace(audioRegex, 'new Audio(getMediaUrl($1))');
    changed = true;
  }

  const imgRegex = /<img([\s\S]*?)src=\{([^\}]+)\}([\s\S]*?)>/g;
  content = content.replace(imgRegex, (match, before, srcVar, after) => {
    // If it's already wrapped, return as is
    if (srcVar.includes('getMediaUrl')) return match;
    changed = true;
    return `<img${before}src={getMediaUrl(${srcVar})}${after}>`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
};

const updateDirectory = (dir) => {
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

console.log('Running script to refactor media URLs...');
updateDirectory(activitiesDir);
console.log('Done!');
