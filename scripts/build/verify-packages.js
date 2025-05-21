#!/usr/bin/env node
/**
 * Package verification script 
 * Tests importing all ElizaOS packages in both ESM and CommonJS formats
 */

async function main() {
    const packages = [
        '@elizaos/types',
        '@elizaos/core',
        '@elizaos/adapter-sqlite',
        '@elizaos/dynamic-imports',
        '@elizaos/plugin-bootstrap',
        '@elizaos/clients/telegram',
        '@elizaos/telegram-multiagent',
        '@elizaos/client-direct',
        '@elizaos/agent'
    ];

    console.log('=== Package Verification ===');

    // Test ESM imports
    console.log('\n🔍 Testing ESM imports...');
    for (const pkg of packages) {
        try {
            const module = await import(pkg);
            console.log(`✅ Successfully imported ${pkg} (ESM)`);
        } catch (error) {
            console.error(`❌ Failed to import ${pkg} (ESM):`, error.message);
            process.exitCode = 1;
        }
    }

    // Test CommonJS imports
    console.log('\n🔍 Testing CommonJS imports...');
    for (const pkg of packages) {
        try {
            const module = require(pkg);
            console.log(`✅ Successfully imported ${pkg} (CJS)`);
        } catch (error) {
            console.error(`❌ Failed to import ${pkg} (CJS):`, error.message);
            process.exitCode = 1;
        }
    }

    if (process.exitCode === 1) {
        console.log('\n❌ Verification failed - see errors above');
    } else {
        console.log('\n✅ All packages verified successfully!');
    }
}

main().catch(error => {
    console.error('Unexpected error during verification:', error);
    process.exit(1);
}); 