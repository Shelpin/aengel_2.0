import fs from 'fs';
import path from 'path';
const packages = fs.readdirSync('packages');
for (const pkg of packages) {
  const dist = path.join('packages', pkg, 'dist');
  if (!fs.existsSync(path.join(dist, 'index.js'))) throw new Error(`${pkg}: index.js missing`);
  if (!fs.existsSync(path.join(dist, 'index.d.ts'))) throw new Error(`${pkg}: index.d.ts missing`);
}
console.log('All dist outputs present.'); 