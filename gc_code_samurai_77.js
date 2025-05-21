// Force garbage collection periodically
const gcInterval = 30000;
console.log('[GC] Starting periodic garbage collection every 30000ms');

setInterval(() => {
  try {
    if (global.gc) {
      console.log('[GC] Running forced garbage collection');
      global.gc();
    }
  } catch (e) {
    console.error('[GC] Error during garbage collection:', e);
  }
}, gcInterval); 