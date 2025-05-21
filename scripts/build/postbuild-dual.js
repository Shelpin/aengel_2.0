#!/usr/bin/env node
/**
 * Post-build script to create .cjs versions of ESM output
 * This enables dual module support (both ESM and CommonJS)
 */

const fs = require('fs');
const path = require('path');

// Get working directory
const currentDir = process.cwd();
const distDir = path.join(currentDir, 'dist');

// Check if the dist dir exists
if (!fs.existsSync(distDir)) {
  console.error(`${distDir} does not exist. Did the TypeScript build fail?`);
  process.exit(1);
}

// Check if index.js exists
const indexFile = path.join(distDir, 'index.js');
if (!fs.existsSync(indexFile)) {
  console.error(`${indexFile} does not exist. Did the TypeScript build fail?`);
  process.exit(1);
}

// Copy index.js to index.cjs
const indexFileContent = fs.readFileSync(indexFile, 'utf8');
const indexCjsFile = path.join(distDir, 'index.cjs');
fs.writeFileSync(indexCjsFile, indexFileContent);

console.log(`Created ${indexCjsFile}`);
console.log('Postbuild completed successfully'); 