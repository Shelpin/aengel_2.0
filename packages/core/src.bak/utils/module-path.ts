import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Universal module path helper that works in both ESM and CJS
export function getModulePath() {
  // ESM environment
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    try {
      return {
        filename: fileURLToPath(import.meta.url),
        dirname: dirname(fileURLToPath(import.meta.url))
      };
    } catch (e) {
      console.warn('Error resolving ESM path:', e);
    }
  }
  
  // CJS environment - return null values to be handled by consumer
  return {
    filename: null,
    dirname: null
  };
} 