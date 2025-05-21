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

// Generate tsup entry resolver log
const generateTsupEntryLog = () => {
    let log = '# TSUP Entry Resolver Log\n\n';

    const packageJsonFiles = findPackageJsonFiles();

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageName = packageJson.name;
        const packageDir = path.dirname(packageJsonPath);

        log += `## ${packageName}\n\n`;

        // Check for tsup.config.ts
        const tsupConfigPath = path.join(packageDir, 'tsup.config.ts');
        if (fileExists(tsupConfigPath)) {
            try {
                const content = fs.readFileSync(tsupConfigPath, 'utf8');
                log += '```typescript\n' + content + '\n```\n\n';

                // Try to extract entry points
                const entryMatch = content.match(/entry:\s*\[(.*?)\]/s);
                if (entryMatch) {
                    log += `Detected entry points: ${entryMatch[1].trim()}\n\n`;
                } else {
                    log += 'Entry points not detected in config.\n\n';
                }
            } catch (error) {
                log += `Error reading tsup config: ${error.message}\n\n`;
            }
        } else {
            // Check for tsup.config.cjs or tsup.config.js
            const altConfigPaths = [
                path.join(packageDir, 'tsup.config.cjs'),
                path.join(packageDir, 'tsup.config.js')
            ];

            let foundAlt = false;
            for (const configPath of altConfigPaths) {
                if (fileExists(configPath)) {
                    try {
                        const content = fs.readFileSync(configPath, 'utf8');
                        log += `Using alternative config file: ${path.basename(configPath)}\n\n`;
                        log += '```javascript\n' + content + '\n```\n\n';
                        foundAlt = true;
                        break;
                    } catch (error) {
                        log += `Error reading alternative tsup config: ${error.message}\n\n`;
                    }
                }
            }

            if (!foundAlt) {
                log += 'No tsup config file found.\n\n';
            }
        }

        // Check for entry points in package.json
        log += "### Package.json Entry Points\n\n";

        if (packageJson.main) {
            log += `main: ${packageJson.main}\n`;
        }

        if (packageJson.module) {
            log += `module: ${packageJson.module}\n`;
        }

        if (packageJson.exports) {
            log += "exports:\n```json\n" + JSON.stringify(packageJson.exports, null, 2) + "\n```\n";
        }

        log += "\n";
    });

    return log;
};

// Main function
const main = () => {
    const tsupEntryLog = generateTsupEntryLog();
    fs.writeFileSync('Eliza/DBIG/tsup-entry-resolver.log', tsupEntryLog);
    console.log('TSUP entry resolver log written to Eliza/DBIG/tsup-entry-resolver.log');
};

main(); 