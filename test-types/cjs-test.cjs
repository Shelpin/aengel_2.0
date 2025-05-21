// Test CJS imports
const { createAgent } = require('../packages/agent/dist/index.cjs');
console.log(typeof createAgent === 'function' ? 'CJS import successful' : 'CJS import failed'); 