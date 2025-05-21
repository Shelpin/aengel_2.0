// Minimal test script for debugging import issues
console.log('Starting minimal test...');

const printErrorDetails = (error: unknown) => {
  console.error('Error:', error);
  if (error instanceof Error) {
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
  if (typeof error === 'object' && error !== null) {
    console.error('Error properties:', Object.keys(error));
  }
};

const main = async () => {
  try {
    // Test if we can import Node.js core modules
    console.log('Importing path module...');
    const path = await import('path');
    console.log('Path module imported successfully');
    
    // Test if we can import other modules from node_modules
    console.log('Importing @elizaos/core module...');
    const elizaCore = await import('@elizaos/core');
    console.log('ElizaOS core imported successfully');
    console.log('Core exports:', Object.keys(elizaCore));
    
    // Try to import the plugin directly
    console.log('Importing our plugin module...');
    const module = await import('./dist/index.js');
    console.log('Plugin module imported successfully!');
    console.log('Plugin exports:', Object.keys(module));
    
    console.log('All imports successful!');
  } catch (error) {
    console.error('Error during imports:');
    printErrorDetails(error);
  }
};

main().catch(error => {
  console.error('Unhandled error:');
  printErrorDetails(error);
}); 