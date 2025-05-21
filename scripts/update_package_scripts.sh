#!/bin/bash

echo "Standardizing build scripts across packages at $(date)"

for PKG in packages/*/; do
  if [ -d "$PKG" ] && [ -f "$PKG/package.json" ]; then
    echo "Updating build scripts for $PKG"
    
    # Create temporary file with standardized build scripts
    cat > "$PKG/build-scripts.json" << 'EOF'
{
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "tsup && tsc -p tsconfig.build.json",
    "build:types": "tsc -p tsconfig.build.json",
    "build:full": "npm run build",
    "clean": "rm -rf dist",
    "dev": "tsup --watch"
  }
}
EOF

    # Merge with existing package.json
    jq -s '.[0] * {scripts: (.[0].scripts * .[1].scripts)}' "$PKG/package.json" "$PKG/build-scripts.json" > "$PKG/package.json.new"
    mv "$PKG/package.json.new" "$PKG/package.json"
    rm "$PKG/build-scripts.json"
    
    # Remove any esbuild references from the package.json
    jq 'del(.scripts[] | select(. | test("esbuild")))' "$PKG/package.json" > "$PKG/package.json.new"
    mv "$PKG/package.json.new" "$PKG/package.json"
  fi
done 