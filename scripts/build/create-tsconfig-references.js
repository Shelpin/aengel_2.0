#!/usr/bin/env node

/**
 * This script generates proper tsconfig.json files with references 
 * to ensure packages can reference each other correctly
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

// Directory containing all packages
const packagesDir = path.join(__dirname, '../../packages');

// Get all directories in packages directory
const packageDirs = fs.readdirSync(packagesDir)
    .filter(dir => fs.statSync(path.join(packagesDir, dir)).isDirectory());

console.log(`${colors.yellow}Updating TypeScript configurations for ${packageDirs.length} packages${colors.reset}`);

// Create base tsconfig.json if it doesn't exist
const baseTsConfigPath = path.join(__dirname, '../../tsconfig.base.json');
if (!fs.existsSync(baseTsConfigPath)) {
    console.log(`${colors.yellow}Creating base TypeScript configuration${colors.reset}`);

    const baseTsConfig = {
        "compilerOptions": {
            "target": "ES2021",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "declaration": true,
            "sourceMap": true,
            "outDir": "dist",
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true
        }
    };

    fs.writeFileSync(baseTsConfigPath, JSON.stringify(baseTsConfig, null, 2));
}

// Update each package's tsconfig.json
for (const packageDir of packageDirs) {
    const packagePath = path.join(packagesDir, packageDir);
    const packageJsonPath = path.join(packagePath, 'package.json');
    const tsConfigPath = path.join(packagePath, 'tsconfig.json');
    const tsBuildConfigPath = path.join(packagePath, 'tsconfig.build.json');

    // Skip if package.json doesn't exist
    if (!fs.existsSync(packageJsonPath)) {
        console.log(`${colors.yellow}Skipping ${packageDir} - no package.json${colors.reset}`);
        continue;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Create tsconfig.json if it doesn't exist
    if (!fs.existsSync(tsConfigPath)) {
        console.log(`${colors.yellow}Creating tsconfig.json for ${packageDir}${colors.reset}`);

        const tsConfig = {
            "extends": "../../tsconfig.base.json",
            "compilerOptions": {
                "rootDir": "src",
                "outDir": "dist",
                "composite": true
            },
            "include": ["src/**/*"],
            "exclude": ["node_modules", "dist", "**/*.test.ts"]
        };

        if (packageDir !== 'types') {
            tsConfig.references = [
                { "path": "../types" }
            ];
        }

        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    } else {
        // Update existing tsconfig.json
        console.log(`${colors.yellow}Updating tsconfig.json for ${packageDir}${colors.reset}`);

        const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

        // Make sure it extends the base config
        tsConfig.extends = "../../tsconfig.base.json";

        // Make sure it has the right references
        if (packageDir !== 'types' && (!tsConfig.references || !tsConfig.references.some(ref => ref.path === "../types"))) {
            tsConfig.references = [
                ...(tsConfig.references || []),
                { "path": "../types" }
            ];
        }

        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    }

    // Create tsconfig.build.json if it doesn't exist
    if (!fs.existsSync(tsBuildConfigPath)) {
        console.log(`${colors.yellow}Creating tsconfig.build.json for ${packageDir}${colors.reset}`);

        const tsBuildConfig = {
            "extends": "./tsconfig.json",
            "exclude": ["**/*.test.ts", "**/*.spec.ts", "test/**"]
        };

        fs.writeFileSync(tsBuildConfigPath, JSON.stringify(tsBuildConfig, null, 2));
    }
}

console.log(`${colors.green}TypeScript configurations updated successfully${colors.reset}`); 