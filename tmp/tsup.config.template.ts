import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    dts: false,
    format: ["esm", "cjs"],
    splitting: true,
    sourcemap: true,
    clean: true,
    external: ["fs", "path", "http", "https"]
}); 