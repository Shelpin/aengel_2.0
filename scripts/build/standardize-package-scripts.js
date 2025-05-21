#!/usr/bin/env node
/**
 * Standardize package.json scripts
 * Updates all package.json files to use standardized build scripts
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Standard scripts to apply to all packages
const standardScripts = {
    prebuild: "rimraf dist",
    build: "tsc -p tsconfig.build.json && node ../../scripts/build/postbuild-dual.js",
    test: "jest",
    lint: "eslint src --ext .ts"
};

// Standard exports field to apply to all packages
const standardExports = {
    ".": {
        "import": "./dist/index.js",
        "require": "./dist/index.cjs",
        "types": "./dist/index.d.ts"
    }
};

// Find all package.json files
const packageJsonFiles = glob.sync('packages/*/package.json');
console.log(`Found ${packageJsonFiles.length} package.json files`);

// Process each package.json
let updated = 0;
for (const packageJsonPath of packageJsonFiles) {
    try {
        // Read the package.json file
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        // Create backup of original package.json
        fs.writeFileSync(`${packageJsonPath}.bak`, packageJsonContent);

        // Check if type field is missing
        if (!packageJson.type) {
            packageJson.type = "module";
            console.log(`Added "type": "module" to ${packageJsonPath}`);
        }

        // Update main and types fields if they exist
        if (packageJson.main) {
            packageJson.main = "./dist/index.js";
        }

        if (packageJson.types) {
            packageJson.types = "./dist/index.d.ts";
        }

        // Update exports field
        packageJson.exports = standardExports;

        // Update scripts
        packageJson.scripts = { ...packageJson.scripts, ...standardScripts };

        // Add files field if it doesn't exist
        if (!packageJson.files) {
            packageJson.files = ["dist"];
        }

        // Write updated package.json
        fs.writeFileSync(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2) + '\n'
        );

        console.log(`✅ Updated ${packageJsonPath}`);
        updated++;
    } catch (error) {
        console.error(`❌ Error processing ${packageJsonPath}:`, error);
    }
}

console.log(`\n=== Summary ===`);
console.log(`Total package.json files: ${packageJsonFiles.length}`);
console.log(`Updated: ${updated}`);
console.log(`Failed: ${packageJsonFiles.length - updated}`);

if (updated === packageJsonFiles.length) {
    console.log(`\n✅ All package.json files updated successfully`);
} else {
    console.error(`\n❌ Some package.json updates failed`);
    process.exit(1);
} 