// simulated-agent-start.js
console.log('🧠 Starting agent with minimal patches...');

// Apply necessary patches
require('./patches/telegram-client-static.js');
require('./patches/init_db.cjs');

console.log('✅ Agent started in simulated mode');
console.log('✅ Telegram client patch applied');
console.log('✅ Database initialized'); 