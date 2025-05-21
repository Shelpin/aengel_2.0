#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get the base configuration
const baseConfig = JSON.parse(fs.readFileSync('tsconfig.build.base.json', 'utf8')).compilerOptions || {};

let log = '# TSConfig Deviation Log\n\n';
log += '## Base Configuration\n\n';
log += '```json\n' + JSON.stringify(baseConfig, null, 2) + '\n```\n\n';

// Find all package.json files
const findPackageJsonFiles = () => {
    try {
        const output = require('child_process').execSync('find packages -name "package.json" | grep -v "node_modules"', { encoding: 'utf8' });
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

    const tsconfig = parseJsonFile(tsconfigPath);

    if (!tsconfig || !tsconfig.compilerOptions) {
        log += `## ${packageName}\n\nNo compiler options found.\n\n`;
        return;
    }

    const compilerOptions = tsconfig.compilerOptions;
    const deviations = [];

    // Check for missing options
    Object.keys(baseConfig).forEach(option => {
        if (compilerOptions[option] === undefined) {
            deviations.push(`Missing option: ${option}`);
        } else if (JSON.stringify(compilerOptions[option]) !== JSON.stringify(baseConfig[option])) {
            deviations.push(`Different value for ${option}: ${JSON.stringify(compilerOptions[option])} (base: ${JSON.stringify(baseConfig[option])})`);
        }
    });

    // Check for additional options
    Object.keys(compilerOptions).forEach(option => {
        if (baseConfig[option] === undefined) {
            deviations.push(`Additional option: ${option}: ${JSON.stringify(compilerOptions[option])}`);
        }
    });

    if (deviations.length > 0) {
        log += `## ${packageName}\n\n`;
        deviations.forEach(deviation => {
            log += `- ${deviation}\n`;
        });
        log += '\n';
    } else {
        log += `## ${packageName}\n\nNo deviations from base configuration.\n\n`;
    }
});

// Write to file
fs.writeFileSync('Eliza/DBIG/tsconfig-deviation.log', log);
console.log('TSConfig deviation log written to Eliza/DBIG/tsconfig-deviation.log'); 