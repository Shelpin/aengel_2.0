// Root tsup.base.js
export const commonExternals = [
    "fs", "path", "os", "util", "child_process", "crypto", "stream", "events",
    "http", "https", "url", "zlib", "assert", "buffer", "querystring", "string_decoder",
    "readline", "tty", "dgram", "dns", "net", "tls"
];

export const baseConfig = {
    entry: ["src/index.ts", "src/public-api.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "node18",
    outDir: "dist",
    splitting: false,
    bundle: true,
    skipNodeModulesBundle: true,
    shims: true,
    minify: false,
    esbuildOptions(options) {
        options.conditions = ["import", "node"];
    },
    external: [
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp',
        'better-sqlite3'
    ]
}; 