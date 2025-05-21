#!/usr/bin/env node
/**
 * Script to standardize package.json exports across ElizaOS packages
 * Part of Phase 7 of the deterministic build plan
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get directory where script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

// Check if we're in write mode
const writeMode = process.argv.includes('--write');
console.log(`Running in ${writeMode ? 'write' : 'dry-run'} mode`);

// Find all package.json files
const packageJsonPaths = await glob('**/package.json', {
    cwd: packagesDir,
    ignore: ['**/node_modules/**', '**/dist/**']
});

console.log(`Found ${packageJsonPaths.length} package.json files to process`);

// Standard exports structure
const standardExports = {
    '.': {
        'import': './dist/index.js',
        'require': './dist/index.cjs',
        'types': './dist/index.d.ts'
    }
};

// Process each package.json
let updatedCount = 0;

for (const relativePath of packageJsonPaths) {
    const fullPath = path.join(packagesDir, relativePath);
    console.log(`Processing ${relativePath}...`);

    // Read current package.json
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Check if exports field needs updating
    let needsUpdate = false;

    // Check if missing exports field
    if (!packageJson.exports) {
        console.log(`  Adding exports field`);
        packageJson.exports = { ...standardExports };
        needsUpdate = true;
    }
    // Check if exports field has incorrect structure
    else if (
        !packageJson.exports['.'] ||
        !packageJson.exports['.']['import'] ||
        !packageJson.exports['.']['require'] ||
        !packageJson.exports['.']['types']
    ) {
        console.log(`  Updating exports field structure`);
        packageJson.exports = { ...standardExports };
        needsUpdate = true;
    }

    // Check if type field is missing or incorrect
    if (!packageJson.type || packageJson.type !== 'module') {
        console.log(`  Setting type: module`);
        packageJson.type = 'module';
        needsUpdate = true;
    }

    // Check if main field is correct
    if (!packageJson.main || packageJson.main !== './dist/index.js') {
        console.log(`  Setting main: ./dist/index.js`);
        packageJson.main = './dist/index.js';
        needsUpdate = true;
    }

    // Check if types field is correct
    if (!packageJson.types || packageJson.types !== './dist/index.d.ts') {
        console.log(`  Setting types: ./dist/index.d.ts`);
        packageJson.types = './dist/index.d.ts';
        needsUpdate = true;
    }

    // Write updated package.json if needed
    if (needsUpdate) {
        updatedCount++;

        if (writeMode) {
            // Create backup first
            const backupPath = `${fullPath}.bak`;
            fs.copyFileSync(fullPath, backupPath);
            console.log(`  Created backup at ${backupPath}`);

            // Write updated package.json
            fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2), 'utf8');
            console.log(`  Updated ${relativePath}`);
        } else {
            console.log(`  Would update ${relativePath} (dry run)`);
        }
    } else {
        console.log(`  No updates needed for ${relativePath}`);
    }
}

console.log('\nExports update summary:');
console.log(`Total package.json files: ${packageJsonPaths.length}`);
console.log(`Files needing updates: ${updatedCount}`);

if (!writeMode && updatedCount > 0) {
    console.log('\nThis was a dry run. Run with --write flag to apply changes:');
    console.log('node scripts/fix-exports.js --write');
}

console.log('\nStandard exports structure:');
console.log(JSON.stringify(standardExports, null, 2));

console.log('\nNext steps in the build plan:');
console.log('1. Run this script with --write flag to apply changes');
console.log('2. Check that all package.json files have been updated');
console.log('3. Proceed to Phase 8: Incremental package builds in graph order'); 