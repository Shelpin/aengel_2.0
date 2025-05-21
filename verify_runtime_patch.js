#!/usr/bin/env node

/**
 * ElizaOS Runtime Patch Verification Script
 * 
 * This script tests the runtime-patch.js to verify that:
 * 1. Environment variables are loaded correctly
 * 2. Runtime is initialized with proper embedding config
 * 3. Runtime has critical methods like handleMessage
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 VERIFICATION: Runtime Patch Test');
console.log('==================================');

// Check environment variables
console.log('Checking environment variables:');
console.log(`- USE_OPENAI_EMBEDDING: ${process.env.USE_OPENAI_EMBEDDING || 'not set'}`);
console.log(`- EMBEDDING_OPENAI_MODEL: ${process.env.EMBEDDING_OPENAI_MODEL || 'not set'}`);
console.log(`- USE_OLLAMA_EMBEDDING: ${process.env.USE_OLLAMA_EMBEDDING || 'not set'}`);
console.log(`- OLLAMA_EMBEDDING_MODEL: ${process.env.OLLAMA_EMBEDDING_MODEL || 'not set'}`);
console.log('');

async function main() {
  try {
    console.log('Loading patched runtime...');
    const { runtime } = await import('./patches/runtime-patch.js');
    
    // Check runtime object
    console.log('\nRuntime Check:');
    console.log(`- Runtime available: ${runtime ? 'yes' : 'no'}`);
    console.log(`- handleMessage function: ${typeof runtime?.handleMessage === 'function' ? 'available' : 'missing'}`);
    console.log(`- Runtime constructor: ${runtime?.constructor?.name || 'unknown'}`);
    
    // Check embedding configuration if accessible
    if (runtime?.embeddingConfig) {
      console.log(`- Embedding provider: ${runtime.embeddingConfig.provider}`);
      console.log(`- Embedding model: ${runtime.embeddingConfig.model}`);
    } else {
      console.log('- Embedding config: not directly accessible');
    }
    
    console.log('\n✅ Verification complete');
    console.log('If the above shows runtime available and handleMessage function available, the patch is working correctly.');
  } catch (error) {
    console.error('\n❌ ERROR DURING VERIFICATION:');
    console.error(error);
    process.exit(1);
  }
}

main(); 