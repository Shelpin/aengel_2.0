#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

// Directory to process
const TARGET_DIR = 'packages/core/src';

// Function to preview import changes
async function processFile(filePath) {
    try {
        // Read file content
        const content = await readFile(filePath, 'utf8');

        // Regex to match import statements with local paths without .js extension
        const importRegex = /from\s+["'](\.[^"']*?)(?!\.js["'])["']/g;

        // Find all matches
        const matches = Array.from(content.matchAll(importRegex));

        if (matches.length > 0) {
            console.log(`\nFile: ${filePath}`);
            console.log('Imports that need .js extension:');

            matches.forEach(match => {
                const [fullMatch, importPath] = match;
                console.log(`  ${fullMatch} -> from "${importPath}.js"`);
            });

            return matches.length;
        }

        return 0;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return 0;
    }
}

// Function to recursively find TypeScript files
async function findTsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const files = entries
        .filter(entry => !entry.isDirectory() && entry.name.endsWith('.ts'))
        .map(entry => path.join(dir, entry.name));

    const directories = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(dir, entry.name));

    const nestedFiles = await Promise.all(
        directories.map(directory => findTsFiles(directory))
    );

    return files.concat(nestedFiles.flat());
}

// Main function
async function main() {
    try {
        console.log(`Finding TypeScript files in ${TARGET_DIR}...`);
        const files = await findTsFiles(TARGET_DIR);
        console.log(`Found ${files.length} TypeScript files.`);

        let totalImportsToFix = 0;
        let filesWithIssues = 0;

        // Process each file
        for (const file of files) {
            const numImports = await processFile(file);
            if (numImports > 0) {
                filesWithIssues++;
                totalImportsToFix += numImports;
            }
        }

        console.log(`\nSummary:`);
        console.log(`Files with imports to fix: ${filesWithIssues}`);
        console.log(`Total imports to fix: ${totalImportsToFix}`);
        console.log(`\nThis is a dry run. No files were modified.`);
        console.log(`To apply changes, run fix_imports.js`);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main(); 