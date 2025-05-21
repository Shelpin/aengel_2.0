#!/usr/bin/env node
/**
 * Script to detect circular dependencies in the ElizaOS packages
 * Part of Phase 6 of the deterministic build plan
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory where script is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');
const reportsDir = path.join(rootDir, 'reports', 'build_output');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Path for output files
const cyclesBeforePath = path.join(reportsDir, 'cycles-before.log');
const cyclesAfterPath = path.join(reportsDir, 'cycles-after.log');
const depGraphPath = path.join(reportsDir, 'dep-graph.png');

// Check if skip-image flag is provided
const skipImage = process.argv.includes('--skip-image');

console.log('Detecting circular dependencies in ElizaOS packages...');

// Save cycles before any changes
try {
    console.log('Generating initial cycles report...');

    const output = execSync('npx madge --circular --extensions ts packages/', {
        encoding: 'utf8'
    });

    fs.writeFileSync(cyclesBeforePath, output);
    console.log(`Initial cycles saved to ${cyclesBeforePath}`);

    // Also generate a dependency graph if not skipped
    if (!skipImage) {
        try {
            console.log('Generating dependency graph visualization...');
            execSync(`npx madge --image ${depGraphPath} --extensions ts packages/`);
            console.log(`Dependency graph saved to ${depGraphPath}`);
        } catch (graphError) {
            console.warn(`Warning: Could not generate dependency graph: ${graphError.message}`);
            console.warn('Continuing without graph visualization.');
        }
    }

    // Count cycles
    const cycleMatches = output.match(/Found (\d+) cycle/);
    const cycleCount = cycleMatches ? parseInt(cycleMatches[1], 10) : 0;

    if (cycleCount > 0) {
        console.log(`\n⚠️  Found ${cycleCount} circular dependencies!`);
        console.log('These need to be resolved according to Phase 6 of the build plan.');
        console.log('\nSuggested resolutions:');
        console.log('1. Move shared types to @elizaos/types package');
        console.log('2. Use dependency injection to break direct dependencies');
        console.log('3. Implement dynamic imports for circular dependencies');
        console.log('4. Extract utility functions to lower-level packages');

        // Parse the cycles for more detailed reporting
        const cyclePaths = output.match(/[^\r\n]+(?=\s→\s)/g);
        if (cyclePaths && cyclePaths.length > 0) {
            console.log('\nTop cycles to resolve:');

            cyclePaths.slice(0, 5).forEach((path, i) => {
                console.log(`${i + 1}. ${path}`);
            });
        }
    } else {
        console.log('\n✅ No circular dependencies found!');
    }
} catch (error) {
    console.error('Error detecting cycles:', error.message);
    process.exit(1);
}

// Check if --fix flag is provided
if (process.argv.includes('--fix')) {
    console.log('\nFix mode enabled. This is a placeholder for automated cycle resolution.');
    console.log('Manual intervention is typically required to properly resolve circular dependencies.');
    console.log('Follow these steps for each cycle:');
    console.log('1. Identify the module involved in the cycle');
    console.log('2. Determine if types can be moved to @elizaos/types');
    console.log('3. Consider interface-based design to break direct dependencies');
    console.log('4. Use dynamic imports for runtime dependencies');

    // After manual fixes, run madge again to check if cycles were resolved
    console.log('\nTo verify cycles are resolved, run this script again without --fix');

    // Example of writing the "after" log (this would be executed after fixes)
    // In a real implementation, this would be generated after applying actual fixes
    const placeholderOutput = 'Processed X files (Ys) (Z warnings)\n\n\n';
    fs.writeFileSync(cyclesAfterPath, placeholderOutput);
}

console.log('\nTo view detailed cycle information, check the reports/build_output directory');
console.log('Next steps in the build plan:');
console.log('1. Resolve all identified cycles');
console.log('2. Run "npx madge --circular packages/" to verify no cycles remain');
console.log('3. Proceed to Phase 7: Uniform package.json exports'); 