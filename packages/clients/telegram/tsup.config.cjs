import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["./src/index.ts"], // Specify the entry point
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm", "cjs"], // Generate both ESM and CJS
    dts: true, // Generate declaration file
    external: [
        "node-telegram-bot-api", // Mark the dependency as external
        // Add other external dependencies if needed (e.g., @elizaos/core)
        "@elizaos/core",
        "dotenv", // Common external dependencies
        "fs",
        "path"
    ],
    // Add any other necessary tsup options
}); 