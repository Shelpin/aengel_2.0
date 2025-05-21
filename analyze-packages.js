#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all package.json files in the packages directory
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

// Get dependencies from package.json
const getDependencies = (packageJson) => {
    const dependencies = [];

    if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(dep => {
            dependencies.push({
                name: dep,
                version: packageJson.dependencies[dep],
                type: 'dependency'
            });
        });
    }

    if (packageJson.devDependencies) {
        Object.keys(packageJson.devDependencies).forEach(dep => {
            dependencies.push({
                name: dep,
                version: packageJson.devDependencies[dep],
                type: 'devDependency'
            });
        });
    }

    if (packageJson.peerDependencies) {
        Object.keys(packageJson.peerDependencies).forEach(dep => {
            dependencies.push({
                name: dep,
                version: packageJson.peerDependencies[dep],
                type: 'peerDependency'
            });
        });
    }

    return dependencies;
};

// Get compiler options from tsconfig.json
const getCompilerOptions = (packageDir) => {
    const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');
    const tsconfig = fileExists(tsconfigPath) ? parseJsonFile(tsconfigPath) : null;

    if (!tsconfig) {
        return null;
    }

    return tsconfig.compilerOptions || null;
};

// Main function to analyze packages
const analyzePackages = () => {
    const packageJsonFiles = findPackageJsonFiles();
    const packages = [];

    packageJsonFiles.forEach(packageJsonPath => {
        const packageJson = parseJsonFile(packageJsonPath);

        if (!packageJson) {
            return;
        }

        const packageDir = path.dirname(packageJsonPath);
        const compilerOptions = getCompilerOptions(packageDir);
        const dependencies = getDependencies(packageJson);

        // Check if tsup.config.ts exists
        const tsupConfigPath = path.join(packageDir, 'tsup.config.ts');
        const hasTsupConfig = fileExists(tsupConfigPath);

        // Find entry files
        let entryFiles = [];
        if (packageJson.main) {
            entryFiles.push(packageJson.main);
        }
        const srcDir = path.join(packageDir, 'src');
        if (fileExists(path.join(srcDir, 'index.ts'))) {
            entryFiles.push('src/index.ts');
        }
        if (fileExists(path.join(srcDir, 'public-api.ts'))) {
            entryFiles.push('src/public-api.ts');
        }

        packages.push({
            name: packageJson.name,
            path: packageJsonPath,
            entryFiles,
            tsconfig: compilerOptions ? 'Yes' : 'No',
            compilerOptions,
            exports: packageJson.exports,
            dependencies,
            hasTsupConfig,
        });
    });

    console.log(JSON.stringify(packages, null, 2));
};

analyzePackages(); 