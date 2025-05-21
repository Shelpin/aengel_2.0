#!/usr/bin/env node
/**
 * Standardize tsconfig.build.json files
 * Creates or updates tsconfig.build.json in each package
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Read the template file
const templatePath = path.join(__dirname, 'tsconfig.build.template.json');
const template = fs.readFileSync(templatePath, 'utf8');
const templateObj = JSON.parse(template);

// Find all package directories
const packageDirs = glob.sync('packages/*').filter(dir => {
    return fs.statSync(dir).isDirectory();
});

console.log(`Found ${packageDirs.length} package directories`);

let updated = 0;
let created = 0;

// Process each package directory
for (const packageDir of packageDirs) {
    const tsconfigPath = path.join(packageDir, 'tsconfig.build.json');
    const packageName = path.basename(packageDir);

    try {
        // Check if the file exists
        const exists = fs.existsSync(tsconfigPath);

        // If it exists, update it
        if (exists) {
            // Read the existing config
            const existingConfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

            // Create a backup
            fs.writeFileSync(`${tsconfigPath}.bak`, JSON.stringify(existingConfig, null, 2));

            // Update with template, preserving any references
            const newConfig = { ...templateObj };
            if (existingConfig.references) {
                newConfig.references = existingConfig.references;
            }

            // Write the updated config
            fs.writeFileSync(tsconfigPath, JSON.stringify(newConfig, null, 2) + '\n');
            console.log(`✅ Updated ${tsconfigPath}`);
            updated++;
        } else {
            // Create a new file from the template
            fs.writeFileSync(tsconfigPath, template);
            console.log(`✅ Created ${tsconfigPath}`);
            created++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${packageDir}:`, error);
    }
}

console.log(`\n=== Summary ===`);
console.log(`Total package directories: ${packageDirs.length}`);
console.log(`Created: ${created}`);
console.log(`Updated: ${updated}`);
console.log(`Failed: ${packageDirs.length - (created + updated)}`);

if (created + updated === packageDirs.length) {
    console.log(`\n✅ All tsconfig.build.json files processed successfully`);
} else {
    console.error(`\n❌ Some tsconfig.build.json updates failed`);
    process.exit(1);
} 