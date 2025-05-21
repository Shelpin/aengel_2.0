// Test script to verify package importability
import * as core from './packages/core/dist/index.js';
import * as agent from './packages/agent/dist/index.js';
import * as bootstrap from './packages/plugin-bootstrap/dist/index.js';
import * as dynamicImports from './packages/dynamic-imports/dist/index.js';
import * as telegramMultiagent from './packages/telegram-multiagent/dist/index.js';

console.log('Core package keys:', Object.keys(core).length > 0 ? 'Imported successfully' : 'Import failed');
console.log('Agent package keys:', Object.keys(agent).length > 0 ? 'Imported successfully' : 'Import failed');
console.log('Bootstrap package keys:', Object.keys(bootstrap).length > 0 ? 'Imported successfully' : 'Import failed');
console.log('Dynamic Imports package keys:', Object.keys(dynamicImports).length > 0 ? 'Imported successfully' : 'Import failed');
console.log('Telegram Multiagent package keys:', Object.keys(telegramMultiagent).length > 0 ? 'Imported successfully' : 'Import failed');

// Log actual exports for verification
console.log('\nCore exports:', Object.keys(core));
console.log('Agent exports:', Object.keys(agent));
console.log('Bootstrap exports:', Object.keys(bootstrap));
console.log('Dynamic Imports exports:', Object.keys(dynamicImports));
console.log('Telegram Multiagent exports:', Object.keys(telegramMultiagent)); 