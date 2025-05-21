#!/bin/bash

if [ -d "packages/core/src" ]; then
  echo "Creating specialized config for core package..."
  
  # Create specialized tsup.config.ts for core
  cat > packages/core/tsup.config.ts << 'EOL'
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/public-api.ts"],
  dts: false,
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["fs", "path", "http", "https"]
});
EOL

  # Create specialized tsconfig.json for core
  cat > packages/core/tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "dom"],
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "resolveJsonModule": true,
    "noImplicitAny": false,
    "allowJs": true,
    "checkJs": false,
    "noEmitOnError": false,
    "moduleDetection": "force",
    "allowArbitraryExtensions": true,
    "customConditions": ["@elizaos/source"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.d.ts", "**/*.test.ts"]
}
EOL

  echo "✅ Core package configuration specialized"
else
  echo "❌ ERROR: core package directory not found"
fi 