// Basic logger implementation
const elizaLogger = {
  debug: (...args: any[]) => console.debug('[ELIZA]', ...args),
  info: (...args: any[]) => console.info('[ELIZA]', ...args),
  warn: (...args: any[]) => console.warn('[ELIZA]', ...args),
  error: (...args: any[]) => console.error('[ELIZA]', ...args),
  log: (...args: any[]) => console.log('[ELIZA]', ...args),
  success: (...args: any[]) => console.info('[ELIZA SUCCESS]', ...args)
};

export { elizaLogger };
export default elizaLogger;
