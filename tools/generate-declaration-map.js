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

// Generate invalid declaration map log
const generateInvalidDeclarationMapLog = () => {
    let log = '# Invalid Declaration Map Log\n\n';

    const packageJsonFiles = findPackageJsonFiles();

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageName = packageJson.name;
        const packageDir = path.dirname(packageJsonPath);
        const distDir = path.join(packageDir, 'dist');

        log += `## ${packageName}\n\n`;

        if (fileExists(distDir)) {
            try {
                const output = execSync(`find "${distDir}" -name "*.d.ts" | wc -l`, { encoding: 'utf8' });
                const dtsCount = parseInt(output.trim(), 10);

                if (dtsCount === 0) {
                    log += `No .d.ts files found in dist directory.\n\n`;
                } else {
                    log += `Found ${dtsCount} .d.ts files in dist directory.\n\n`;

                    // List all .d.ts files
                    const dtsFiles = execSync(`find "${distDir}" -name "*.d.ts" | sort`, { encoding: 'utf8' });
                    log += "Declaration files:\n```\n" + dtsFiles + "```\n\n";

                    // Check for .d.ts.map files
                    const dtsMapFiles = execSync(`find "${distDir}" -name "*.d.ts.map" | wc -l`, { encoding: 'utf8' });
                    const dtsMapCount = parseInt(dtsMapFiles.trim(), 10);
                    log += `Declaration map files: ${dtsMapCount}\n\n`;

                    // Check if package.json has types field
                    if (packageJson.types) {
                        log += `Types field in package.json: ${packageJson.types}\n`;
                        log += `Types file exists: ${fileExists(path.join(packageDir, packageJson.types)) ? 'Yes' : 'No'}\n\n`;
                    } else if (packageJson.exports) {
                        log += "Exports field in package.json contains types:\n```json\n" +
                            JSON.stringify(packageJson.exports, null, 2) +
                            "\n```\n\n";
                    } else {
                        log += "No types or exports field found in package.json.\n\n";
                    }

                    // Check if main index.d.ts exists
                    const mainDtsExists = fileExists(path.join(distDir, 'index.d.ts'));
                    log += `Main index.d.ts exists: ${mainDtsExists ? 'Yes' : 'No'}\n\n`;

                    // Check if public-api.d.ts exists
                    const publicApiDtsExists = fileExists(path.join(distDir, 'public-api.d.ts'));
                    log += `public-api.d.ts exists: ${publicApiDtsExists ? 'Yes' : 'No'}\n\n`;
                }
            } catch (error) {
                log += `Error checking declaration files: ${error.message}\n\n`;
            }
        } else {
            log += `No dist directory found.\n\n`;
        }
    });

    return log;
};

// Generate dist tree
const generateDistTree = () => {
    let json = {};

    const packageJsonFiles = findPackageJsonFiles();

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageName = packageJson.name;
        const packageDir = path.dirname(packageJsonPath);
        const distDir = path.join(packageDir, 'dist');

        if (fileExists(distDir)) {
            try {
                const output = execSync(`find "${distDir}" -type f | sort`, { encoding: 'utf8' });
                json[packageName] = output.trim().split('\n');
            } catch (error) {
                json[packageName] = [`Error: ${error.message}`];
            }
        } else {
            json[packageName] = ['No dist directory found'];
        }
    });

    return JSON.stringify(json, null, 2);
};

// Main function
const main = () => {
    const invalidDeclarationMapLog = generateInvalidDeclarationMapLog();
    fs.writeFileSync('Eliza/DBIG/invalid-declaration-map.log', invalidDeclarationMapLog);
    console.log('Invalid declaration map log written to Eliza/DBIG/invalid-declaration-map.log');

    const distTree = generateDistTree();
    fs.writeFileSync('Eliza/DBIG/dist-tree.json', distTree);
    console.log('Dist tree written to Eliza/DBIG/dist-tree.json');
};

main(); 