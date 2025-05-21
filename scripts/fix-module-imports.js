#!/usr/bin/env node

/**
 * This script fixes import statements by removing .js extensions from external package imports
 * For example: 
 * - "dotenv.js" => "dotenv"
 * - "unique-names-generator.js" => "unique-names-generator"
 * 
 * But preserves .js extensions for local imports (following ES Module requirements)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Packages that need to have .js extension removed
const PACKAGES_TO_FIX = [
    'dotenv.js',
    'unique-names-generator.js',
    'ollama-ai-provider.js',
    'js-tiktoken.js',
    'together-ai.js',
    'nanoevents.js',
    'fs/promises.js',
    'pino.js',
    'pino-pretty.js',
    'glob.js',
    'fastembed.js',
    'viem.js',
];

function processFile(filePath) {
    console.log(`Processing file: ${filePath}`);

    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');

    // Create a backup
    const backupPath = `${filePath}.bak`;
    fs.writeFileSync(backupPath, content);

    // Find and replace imports
    let modifiedContent = content;

    for (const packageName of PACKAGES_TO_FIX) {
        const normalizedName = packageName.replace('.js', '');

        // Replace in various import patterns
        modifiedContent = modifiedContent.replace(
            new RegExp(`from ["']${packageName}["']`, 'g'),
            `from "${normalizedName}"`
        );

        modifiedContent = modifiedContent.replace(
            new RegExp(`import ["']${packageName}["']`, 'g'),
            `import "${normalizedName}"`
        );

        modifiedContent = modifiedContent.replace(
            new RegExp(`require\\(["']${packageName}["']\\)`, 'g'),
            `require("${normalizedName}")`
        );
    }

    if (modifiedContent !== content) {
        fs.writeFileSync(filePath, modifiedContent);
        console.log(`✅ Fixed imports in: ${filePath}`);
        return true;
    }

    // Delete backup if no changes were made
    fs.unlinkSync(backupPath);
    return false;
}

function processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    let fixedCount = 0;

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                fixedCount += processDirectory(fullPath);
            }
        } else if (entry.isFile() &&
            (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
            if (processFile(fullPath)) {
                fixedCount++;
            }
        }
    }

    return fixedCount;
}

// Main execution
function main() {
    if (process.argv.length < 3) {
        console.error('Usage: node fix-module-imports.js <directory>');
        process.exit(1);
    }

    const targetDir = process.argv[2];

    if (!fs.existsSync(targetDir)) {
        console.error(`Directory not found: ${targetDir}`);
        process.exit(1);
    }

    console.log(`Fixing imports in directory: ${targetDir}`);
    const fixedCount = processDirectory(targetDir);
    console.log(`✅ Fixed imports in ${fixedCount} files`);
}

main(); 