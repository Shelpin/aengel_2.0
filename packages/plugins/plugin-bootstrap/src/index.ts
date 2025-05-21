// Removed problematic import: import { ElizaService } from '@elizaos/service-provider';

// Added to satisfy runtime registration check - low priority fix
export async function register(runtime: any) { // Added runtime param for potential future use
    // No-op register to suppress runtime warning during initialization
    if (runtime && typeof runtime.getLogger === 'function') {
        runtime.getLogger('plugin-bootstrap').debug('Executing no-op register function.');
    } else {
        console.log('[plugin-bootstrap] Executing no-op register function (logger unavailable).');
    }
    return;
}

export default {
    name: '@elizaos/plugin-bootstrap',
    // ... existing code ...
} 