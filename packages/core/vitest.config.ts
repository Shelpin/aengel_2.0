import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        setupFiles: [require.resolve("@elizaos/test-utils/src/testSetup.ts")],
        environment: "node",
        globals: true,
        testTimeout: 120000,
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@elizaos/test-utils": path.resolve(__dirname, "../test-utils/src"),
        },
    },
});
