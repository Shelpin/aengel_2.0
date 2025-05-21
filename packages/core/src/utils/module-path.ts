import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Universal module path helper that works in both ESM and CJS
export function getModulePath(): { dirname: string } {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return { dirname: __dirname };
  } catch (error) {
    // Fallback for environments where import.meta.url is not available
    return { dirname: process.cwd() };
  }
} 