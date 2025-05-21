import type { Options } from 'tsup';

const config: Options = {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  splitting: false,
  dts: false,
  target: 'node18',
  outDir: 'dist',
  outExtension: (ctx) => ({ js: ctx.format === 'cjs' ? '.cjs' : '.js' }),
  external: ['@elizaos/core', '@aeternity/aepp-sdk', '@aeternity/hd-wallet'],
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.js', '.json'];
  },
  tsconfig: 'tsconfig.json',
};

export default config;
