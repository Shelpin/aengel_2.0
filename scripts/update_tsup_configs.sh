#!/bin/bash

for PKG in packages/*/; do
  if [ -d "$PKG" ] && [ -f "$PKG/src/index.ts" ]; then
    echo "Updating tsup config for $PKG"
    
    # Check if public-api.ts exists
    PUBLIC_API=""
    if [ -f "$PKG/src/public-api.ts" ]; then
      PUBLIC_API=', "src/public-api.ts"'
    fi
    
    # Determine external dependencies
    EXTERNALS="[\"fs\", \"path\", \"http\", \"https\"]"
    if grep -q "import.*from 'node-telegram-bot-api'" "$PKG/src"/*.ts 2>/dev/null; then
      EXTERNALS="[\"fs\", \"path\", \"http\", \"https\", \"node-telegram-bot-api\"]"
    fi
    
    # Create standardized tsup.config.ts
    cat > "$PKG/tsup.config.ts" << EOF
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ["src/index.ts"$PUBLIC_API],
  dts: false,
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  clean: true,
  external: $EXTERNALS
});
EOF
  fi
done 