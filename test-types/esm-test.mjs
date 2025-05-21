// Test ESM imports
import { createAgent } from '../packages/agent/dist/index.js';
console.log(typeof createAgent === 'function' ? 'ESM import successful' : 'ESM import failed'); 