#!/usr/bin/env node
/**
 * Check for circular dependencies in the codebase
 * Uses madge to detect circular dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create reports directory if it doesn't exist
const reportsDir = path.join(process.cwd(), 'reports', 'build_output');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Output files
const cyclesBeforeFile = path.join(reportsDir, 'cycles-before.log');
const cyclesAfterFile = path.join(reportsDir, 'cycles-after.log');

console.log('Checking for circular dependencies...');

try {
    // Check if madge is installed
    try {
        execSync('npx madge --version', { stdio: 'ignore' });
    } catch (error) {
        console.log('Installing madge...');
        execSync('pnpm add -D madge', { stdio: 'inherit' });
    }

    // Generate the before snapshot if it doesn't exist
    if (!fs.existsSync(cyclesBeforeFile)) {
        console.log('Generating initial cycles snapshot...');
        try {
            const output = execSync('npx madge --circular --extensions ts packages/', { encoding: 'utf8' });
            fs.writeFileSync(cyclesBeforeFile, output);
            console.log(`Saved initial cycles to ${cyclesBeforeFile}`);
        } catch (error) {
            console.error('Error generating initial cycles snapshot:', error.message);
        }
    }

    // Check for current circular dependencies
    console.log('Checking current circular dependencies...');
    try {
        const currentCycles = execSync('npx madge --circular --extensions ts packages/', { encoding: 'utf8' });
        fs.writeFileSync(cyclesAfterFile, currentCycles);

        if (currentCycles.trim()) {
            console.log('\n⚠️ Circular dependencies found:');
            console.log(currentCycles);

            // Count number of cycles
            const cycleCount = (currentCycles.match(/Found \d+ cycle/g) || ['Found 0 cycle'])[0]
                .match(/\d+/)[0];

            if (parseInt(cycleCount) > 0) {
                console.log(`\n❌ ${cycleCount} circular dependencies detected.`);
                console.log('Please resolve these circular dependencies before building.');
                process.exit(1);
            }
        } else {
            console.log('✅ No circular dependencies found!');
        }
    } catch (error) {
        if (error.stdout) {
            fs.writeFileSync(cyclesAfterFile, error.stdout);
            console.error('❌ Circular dependencies check failed:');
            console.error(error.stdout);
        } else {
            console.error('❌ Failed to check circular dependencies:', error.message);
        }
        process.exit(1);
    }

    // Generate dependency graph image
    console.log('\nGenerating dependency graph image...');
    try {
        execSync('npx madge --image reports/build_output/dep-graph-after.png --extensions ts packages/', { stdio: 'inherit' });
        console.log('✅ Dependency graph generated at reports/build_output/dep-graph-after.png');
    } catch (error) {
        console.error('❌ Failed to generate dependency graph:', error.message);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} 