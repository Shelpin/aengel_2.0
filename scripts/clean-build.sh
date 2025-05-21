#!/bin/bash
set -e

echo "=== ElizaOS Clean Build ==="
echo "Building packages in dependency graph order"

# Updated ORDER array to match actual directory structure
ORDER=( types core adapter-sqlite dynamic-imports plugin-bootstrap clients telegram-multiagent client-direct agent )

# Clean all packages first
echo "Cleaning all packages..."
for p in "${ORDER[@]}"; do 
  echo "Cleaning @elizaos/${p}..."
  cd "packages/${p}"
  rm -rf dist
  cd ../../
done

# Build each package in order
echo "Building packages in order..."
for p in "${ORDER[@]}"; do 
  echo "Building @elizaos/${p}..."
  cd "packages/${p}"
  
  # Check if package has a build script
  if grep -q "\"build\"" package.json; then
    pnpm run build
  else
    echo "No build script found, using tsc directly"
    npx tsc -p tsconfig.json
  fi
  
  # Copy index.js to index.cjs for CJS compatibility if needed
  if [ -f "dist/index.js" ]; then
    cp dist/index.js dist/index.cjs
    echo "Created CJS compatibility file: dist/index.cjs"
  fi
  
  cd ../../
  echo "Successfully built @elizaos/${p}"
  echo "-----------------------------------"
done

echo "Build complete!" 