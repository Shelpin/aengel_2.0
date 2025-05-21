const { createAgent } = require('../packages/agent/dist/index.cjs');

console.log('Starting agent initialization test...');

async function testAgent() {
    try {
        const agent = createAgent({ id: 'test-agent' });
        console.log('Agent created successfully ✅');
        return true;
    } catch (error) {
        console.error('Agent creation failed ❌', error);
        return false;
    }
}

testAgent().then(success => {
    console.log(`Test ${success ? 'passed' : 'failed'} with status code: ${success ? 0 : 1}`);
    process.exit(success ? 0 : 1);
}); 