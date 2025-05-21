#!/usr/bin/env node

/**
 * This script fixes Node.js built-in module imports by replacing:
 * - 'path.js' -> 'node:path'
 * - 'fs.js' -> 'node:fs'
 * etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const WRITE = process.argv.includes('--write');
const VERBOSE = process.argv.includes('--verbose');

// Define Node.js built-in modules that need fixing
const NODE_MODULES = [
    'path',
    'fs',
    'os',
    'url',
    'stream',
    'net',
    'util',
    'module',
    'child_process',
    'crypto',
    'events',
    'http',
    'https',
    'readline',
    'querystring',
    'buffer',
    'assert',
    'tty',
    'zlib',
];

// Define third-party modules that don't need .js extension
const THIRD_PARTY_MODULES = [
    'express',
    'body-parser',
    'cors',
    'handlebars',
    'multer',
    'openai',
    'zod',
    'uuid',
    'js-sha1',
    'better-sqlite3',
    'sqlite-vec',
    'json5',
    'yargs',
];

// Find all TypeScript files
function findTsFiles(directory) {
    const allFiles = [];

    function traverse(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('dist')) {
                traverse(fullPath);
            } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
                allFiles.push(fullPath);
            }
        }
    }

    traverse(directory);
    return allFiles;
}

// Fix imports in a file
function fixImports(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    let fixed = content;

    // Fix Node.js built-in modules
    for (const moduleName of NODE_MODULES) {
        // This regex matches different import patterns for the module
        const regex = new RegExp(`from ['"](${moduleName}\\.js)['"]`, 'g');
        const replacedContent = fixed.replace(regex, `from 'node:${moduleName}'`);

        if (replacedContent !== fixed) {
            changes += (fixed.match(regex) || []).length;
            fixed = replacedContent;
        }
    }

    // Fix third-party modules
    for (const moduleName of THIRD_PARTY_MODULES) {
        const regex = new RegExp(`from ['"]${moduleName}\\.js['"]`, 'g');
        const replacedContent = fixed.replace(regex, `from '${moduleName}'`);

        if (replacedContent !== fixed) {
            changes += (fixed.match(regex) || []).length;
            fixed = replacedContent;
        }
    }

    if (changes > 0) {
        if (VERBOSE) {
            console.log(`Found ${changes} import(s) to fix in ${filePath}`);
        }

        if (WRITE) {
            fs.writeFileSync(filePath, fixed, 'utf8');
            console.log(`Updated ${filePath}`);
        }

        return changes;
    }

    return 0;
}

// Main function
function main() {
    console.log('Finding TypeScript files...');
    const tsFiles = findTsFiles('packages');
    console.log(`Found ${tsFiles.length} TypeScript files to process.`);

    let totalChanges = 0;
    let changedFiles = 0;

    for (const file of tsFiles) {
        const changes = fixImports(file);
        totalChanges += changes;

        if (changes > 0) {
            changedFiles++;
        }
    }

    console.log('\nSummary:');
    console.log(`- Files processed: ${tsFiles.length}`);
    console.log(`- Files with changes: ${changedFiles}`);
    console.log(`- Total imports fixed: ${totalChanges}`);

    if (DRY_RUN) {
        console.log('\nThis was a dry run. No files were modified.');
        console.log('Use --write to apply changes.');
    } else if (WRITE) {
        console.log('\nAll changes have been applied.');
    } else {
        console.log('\nNo changes were made. Use --write to apply changes.');
    }
}

main(); 