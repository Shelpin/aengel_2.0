// Test script to verify package importability (CommonJS)
const core = require('./packages/core/dist/index.cjs');
const agent = require('./packages/agent/dist/index.cjs');
const bootstrap = require('./packages/plugin-bootstrap/dist/index.cjs');
const dynamicImports = require('./packages/dynamic-imports/dist/index.cjs');
const telegramMultiagent = require('./packages/telegram-multiagent/dist/index.cjs');

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