# Adding a New Package to ElizaOS

## Quick Reference

1. Create package structure:
```bash
mkdir -p packages/your-new-package/src
```

2. Initialize package.json:
```bash
cd packages/your-new-package
pnpm init
```

3. Add standard files:
- src/index.ts (main entry point)
- src/public-api.ts (if needed for exposing public API)
- tsconfig.json (extend from root)
- tsconfig.build.json (for declaration generation)

4. Add build configuration:
```bash
# Create tsup.config.ts
cat > tsup.config.ts << 'EOF'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ["src/index.ts"],
  dts: false,
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["fs", "path", "http", "https"]
});
EOF

# Add standard build scripts to package.json
```

5. Set up package.json properly:
```json
{
  "name": "@elizaos/your-new-package",
  "version": "0.25.9",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "tsup && tsc -p tsconfig.build.json",
    "build:types": "tsc -p tsconfig.build.json",
    "clean": "rm -rf dist"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "types": "./dist/index.d.ts",
  "main": "./dist/index.js",
  "module": "./dist/index.js"
}
```

6. Build the package:
```bash
pnpm --filter @elizaos/your-new-package run build
``` 