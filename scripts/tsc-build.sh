#!/bin/bash

# Script to build all packages using tsc directly instead of tsup
# Following the requirements in deterministic-build-plan rule

set -e

# Define the list of packages in the correct build order
PACKAGES=(
  "core"
  "adapter-sqlite"
  "dynamic-imports"
  "plugin-bootstrap"
  "clients/telegram"
  "telegram-multiagent"
  "client-direct"
  "agent"
)

# Clean all dist directories
echo "Cleaning dist directories..."
pnpm -r exec -- rm -rf dist

# Build each package
for pkg in "${PACKAGES[@]}"; do
  echo "Building @elizaos/${pkg}..."
  
  if [[ "$pkg" == *"/"* ]]; then
    # Handle nested packages like clients/telegram
    parent_dir=$(echo "$pkg" | cut -d '/' -f 1)
    child_dir=$(echo "$pkg" | cut -d '/' -f 2)
    cd "packages/${parent_dir}/${child_dir}"
  else
    cd "packages/${pkg}"
  fi
  
  # Ensure tsconfig.build.json exists
  if [ ! -f "tsconfig.build.json" ]; then
    echo "Creating tsconfig.build.json..."
    cat > tsconfig.build.json << EOF
{
  "extends": "../../tsconfig.build.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
EOF
  fi
  
  # Build using tsc
  echo "Running tsc for @elizaos/${pkg}..."
  tsc -p tsconfig.build.json
  
  # Create package.json in dist directory with proper exports
  echo "Creating package.json in dist directory..."
  cat > dist/package.json << EOF
{
  "name": "@elizaos/${pkg}",
  "type": "module",
  "main": "index.js",
  "types": "index.d.ts"
}
EOF
  
  # Return to root directory
  cd - > /dev/null
done

echo "All packages built successfully using tsc!" 