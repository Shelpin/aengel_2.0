#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Script to fix import paths in TypeScript files to ensure proper ESM compatibility
 * Adds .js extensions to imports when required
 */

const shouldWrite = process.argv.includes('--write');
const packagesDir = path.resolve('./packages');

console.log(`Starting import path fixing (${shouldWrite ? 'write mode' : 'dry run mode'})`);
console.log(`Looking for TypeScript files in ${packagesDir}...`);

// Find all TS files in the packages
const tsFiles = glob.sync('**/src/**/*.ts', {
    cwd: packagesDir,
    ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
});

console.log(`Found ${tsFiles.length} TypeScript files to process`);

let fixedFiles = 0;
let fixedImports = 0;

// Process each file
for (const relativeFilePath of tsFiles) {
    const filePath = path.join(packagesDir, relativeFilePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;

    // Find all imports and exports
    const newContent = content.replace(
        /(import|export)(.+?from\s+['"])([^'"@][^'"]*?)(['"])/g,
        (match, importOrExport, middle, importPath, quote) => {
            // Skip if it already has an extension or it's a package import
            if (importPath.endsWith('.js') || importPath.startsWith('@') || importPath.includes('node:')) {
                return match;
            }

            // Skip if it's a directory import with index.ts
            if (importPath.endsWith('/')) {
                return match;
            }

            // Add .js extension
            const newImport = `${importOrExport}${middle}${importPath}.js${quote}`;

            fixedImports++;
            return newImport;
        }
    );

    if (newContent !== content) {
        fileChanged = true;
        fixedFiles++;

        if (shouldWrite) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Fixed imports in: ${relativeFilePath}`);
        } else {
            console.log(`Would fix imports in: ${relativeFilePath}`);
        }
    }
}

console.log('');
console.log('Import fixing summary:');
console.log(`- Files processed: ${tsFiles.length}`);
console.log(`- Files with fixes: ${fixedFiles}`);
console.log(`- Total imports fixed: ${fixedImports}`);

if (!shouldWrite && fixedImports > 0) {
    console.log('');
    console.log('This was a dry run. To actually apply the changes, run with --write flag:');
    console.log('node scripts/fix-import-extensions.js --write');
} 