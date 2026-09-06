import fs from 'node:fs';
import path from 'node:path';

function checkPaths(file, baseDir) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["']/g)];
  console.log('Checking', file, 'found', matches.length, 'images:');
  for (const m of matches) {
    const full = path.resolve(baseDir, m[1]);
    const exists = fs.existsSync(full);
    console.log(exists ? '  ✓' : '  ✗', m[1]);
    if (!exists) throw new Error('Missing file: ' + full);
  }
}

checkPaths('c:/Users/sanja/Desktop/reprise-source (1)/reprise/README.md', 'c:/Users/sanja/Desktop/reprise-source (1)/reprise');
checkPaths('c:/Users/sanja/Desktop/reprise-source (1)/README.md', 'c:/Users/sanja/Desktop/reprise-source (1)');
console.log('\nALL IMAGE ASSET PATHS VERIFIED SUCCESSFULLY!');
