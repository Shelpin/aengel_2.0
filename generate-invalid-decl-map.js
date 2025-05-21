#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate invalid declaration map log
let log = '# Invalid Declaration Map Log\n\n';

const packageDirs = fs.readdirSync('packages').filter(dir => {
    return fs.statSync(path.join('packages', dir)).isDirectory() && !dir.startsWith('.');
});

packageDirs.forEach(pkgDir => {
    const packageJsonPath = path.join('packages', pkgDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.name;
    const distDir = path.join('packages', pkgDir, 'dist');

    log += '## ' + packageName + '\n\n';

    if (fs.existsSync(distDir)) {
        try {
            const dtsFiles = execSync(`find "${distDir}" -name "*.d.ts" | wc -l`, { encoding: 'utf8' });
            const dtsCount = parseInt(dtsFiles.trim(), 10);

            if (dtsCount === 0) {
                log += 'No .d.ts files found in dist directory.\n\n';
            } else {
                log += `Found ${dtsCount} .d.ts files in dist directory.\n\n`;

                // Check for .d.ts.map files
                const dtsMapFiles = execSync(`find "${distDir}" -name "*.d.ts.map" | wc -l`, { encoding: 'utf8' });
                const dtsMapCount = parseInt(dtsMapFiles.trim(), 10);
                log += `Declaration map files: ${dtsMapCount}\n\n`;

                // Check for specific entry point d.ts files
                const indexDtsExists = fs.existsSync(path.join(distDir, 'index.d.ts'));
                log += `index.d.ts exists: ${indexDtsExists ? 'Yes' : 'No'}\n`;

                const publicApiDtsExists = fs.existsSync(path.join(distDir, 'public-api.d.ts'));
                log += `public-api.d.ts exists: ${publicApiDtsExists ? 'Yes' : 'No'}\n\n`;
            }
        } catch (error) {
            log += `Error checking declaration files: ${error.message}\n\n`;
        }
    } else {
        log += 'No dist directory found.\n\n';
    }
});

// Generate dist tree
let distTree = {};

packageDirs.forEach(pkgDir => {
    const packageJsonPath = path.join('packages', pkgDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const packageName = packageJson.name;
    const distDir = path.join('packages', pkgDir, 'dist');

    if (fs.existsSync(distDir)) {
        try {
            const files = execSync(`find "${distDir}" -type f | sort`, { encoding: 'utf8' });
            distTree[packageName] = files.split('\n').filter(Boolean);
        } catch (error) {
            distTree[packageName] = [`Error: ${error.message}`];
        }
    } else {
        distTree[packageName] = ['No dist directory found'];
    }
});

fs.writeFileSync('Eliza/DBIG/invalid-declaration-map.log', log);
console.log('Invalid declaration map log written to Eliza/DBIG/invalid-declaration-map.log');

fs.writeFileSync('Eliza/DBIG/dist-tree.json', JSON.stringify(distTree, null, 2));
console.log('Dist tree written to Eliza/DBIG/dist-tree.json'); 