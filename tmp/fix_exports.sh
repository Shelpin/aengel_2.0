#!/bin/bash

# Process each package to standardize exports
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && -d "$PKG/src" ]]; then
    echo "Fixing exports for $PKGNAME..."
    
    # Create an object-based exports field instead of array
    cat > "$PKG/package.json" << EOL
{
  "name": "$(grep '"name"' "$PKG/package.json" | head -1 | sed 's/.*: "//;s/".*//' || echo "@elizaos/$PKGNAME")",
  "type": "module",
  "main": "dist/index.cjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "prebuild": "rimraf dist && mkdir -p dist",
    "build": "tsup --config tsup.config.ts && tsc -p tsconfig.build.json"
  }
}
EOL
    
    # Add public-api export if the file exists
    if [ -f "$PKG/src/public-api.ts" ]; then
      # Insert public-api export before the package.json entry
      sed -i '/.*"package.json".*/i \    "./public-api": {\n      "types": "./dist/public-api.d.ts",\n      "import": "./dist/public-api.js",\n      "require": "./dist/public-api.cjs"\n    },' "$PKG/package.json"
    fi
    
    echo "$PKGNAME exports fixed"
  fi
done

# Process nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -d "$CLIENT_PKG/src" ]; then
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Fixing exports for clients/$CLIENT_NAME..."
    
    # Create an object-based exports field instead of array
    cat > "$CLIENT_PKG/package.json" << EOL
{
  "name": "$(grep '"name"' "$CLIENT_PKG/package.json" | head -1 | sed 's/.*: "//;s/".*//' || echo "@elizaos/clients/$CLIENT_NAME")",
  "type": "module",
  "main": "dist/index.cjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "prebuild": "rimraf dist && mkdir -p dist",
    "build": "tsup --config tsup.config.ts && tsc -p tsconfig.build.json"
  }
}
EOL
    
    echo "clients/$CLIENT_NAME exports fixed"
  fi
done

echo "✅ Package.json exports fixed" 