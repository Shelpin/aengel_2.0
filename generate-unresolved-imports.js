#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all package.json files
const findPackageJsonFiles = () => {
    try {
        const output = execSync('find packages -name "package.json" | grep -v "node_modules"', { encoding: 'utf8' });
        return output.trim().split('\n');
    } catch (error) {
        console.error('Error finding package.json files:', error.message);
        return [];
    }
};

// Parse a JSON file
const parseJsonFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error parsing JSON file ${filePath}:`, error.message);
        return null;
    }
};

// Check if a file exists
const fileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
};

// Generate unresolved imports log
const generateUnresolvedImportsLog = () => {
    let log = '# Unresolved Imports Log\n\n';

    const packageJsonFiles = findPackageJsonFiles();

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageName = packageJson.name;
        const packageDir = path.dirname(packageJsonPath);
        const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');

        if (!fileExists(tsconfigPath)) {
            log += `## ${packageName}\n\nNo tsconfig.build.json found.\n\n`;
            return;
        }

        try {
            const output = execSync(`cd "${packageDir}" && tsc -p tsconfig.build.json --noEmit 2>&1 | grep "TS2307" || true`, { encoding: 'utf8' });
            if (output.trim()) {
                log += `## ${packageName}\n\n\`\`\`\n${output}\n\`\`\`\n\n`;
            } else {
                log += `## ${packageName}\n\nNo unresolved imports found.\n\n`;
            }
        } catch (error) {
            log += `## ${packageName}\n\nError checking unresolved imports: ${error.message}\n\n`;
        }
    });

    return log;
};

// Main function
const main = () => {
    const unresolvedImportsLog = generateUnresolvedImportsLog();
    fs.writeFileSync('Eliza/DBIG/unresolved-imports.log', unresolvedImportsLog);
    console.log('Unresolved imports log written to Eliza/DBIG/unresolved-imports.log');
};

main(); 