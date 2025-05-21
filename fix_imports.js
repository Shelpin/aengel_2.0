#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Directory to process
const TARGET_DIR = 'packages/core/src';

// Function to add .js extension to local imports
async function processFile(filePath) {
    try {
        // Read file content
        const content = await readFile(filePath, 'utf8');

        // Regex to match import statements with local paths without .js extension
        // This looks for 'from "./' or 'from "../' followed by anything except " followed by '"'
        // and doesn't match if '.js"' is already there
        const importRegex = /from\s+["'](\.[^"']*?)(?!\.js["'])["']/g;

        // Replace with .js extension
        const updatedContent = content.replace(importRegex, 'from "$1.js"');

        // Only write file if changes were made
        if (content !== updatedContent) {
            console.log(`Updating imports in: ${filePath}`);
            await writeFile(filePath, updatedContent, 'utf8');
            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
        return false;
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

        let updatedCount = 0;

        // Process each file
        for (const file of files) {
            const updated = await processFile(file);
            if (updated) updatedCount++;
        }

        console.log(`Updated imports in ${updatedCount} files.`);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main(); 