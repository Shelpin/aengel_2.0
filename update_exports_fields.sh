#!/bin/bash

# Loop through packages to update their exports fields
for PKG in packages/*/; do
  if [ "$PKG" != "packages/core/" ]; then  # Skip core, we already did it
    echo "Setting up standard exports for $PKG"
    
    if [ -f "$PKG/src/public-api.ts" ]; then
      # For packages with public-api.ts
      cat > "$PKG/exports-field.json" << 'EOF'
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./public-api": {
      "types": "./dist/public-api.d.ts",
      "import": "./dist/public-api.js",
      "require": "./dist/public-api.cjs"
    }
  },
  "types": "./dist/index.d.ts",
  "main": "./dist/index.js",
  "module": "./dist/index.js"
}
EOF
    else
      # For packages without public-api.ts
      cat > "$PKG/exports-field.json" << 'EOF'
{
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
EOF
    fi
    
    # Merge with package.json
    jq -s '.[0] * .[1]' "$PKG/package.json" "$PKG/exports-field.json" > "$PKG/package.json.new"
    mv "$PKG/package.json.new" "$PKG/package.json"
    rm "$PKG/exports-field.json"
  fi
done 