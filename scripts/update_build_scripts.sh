#!/bin/bash
for pkg in packages/*; do
  if [ -f "$pkg/package.json" ]; then
    echo "Updating $pkg/package.json build script"
    # Update build script to explicitly call tsc
    jq '.scripts.build = "tsup --config tsup.config.ts && ../../node_modules/.bin/tsc -p tsconfig.build.json --emitDeclarationOnly"' "$pkg/package.json" > "$pkg/package.json.tmp" && mv "$pkg/package.json.tmp" "$pkg/package.json"
  fi
done 