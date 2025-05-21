#!/bin/bash

# Process each package to standardize exports
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && -d "$PKG/src" ]]; then
    echo "Standardizing exports for $PKGNAME..."
    cd "$PKG"
    
    # Backup package.json
    cp package.json package.json.bak
    
    # Standard export pattern (indexes only)
    npm pkg set "exports.."="{\"types\":\"./dist/index.d.ts\",\"import\":\"./dist/index.js\",\"require\":\"./dist/index.cjs\"}" "exports./package.json"="./package.json"
    
    # Add public-api export if the file exists
    if [ -f "src/public-api.ts" ]; then
      npm pkg set "exports./public-api"="{\"types\":\"./dist/public-api.d.ts\",\"import\":\"./dist/public-api.js\",\"require\":\"./dist/public-api.cjs\"}"
    fi
    
    # Check for jq to remove any malformed numeric keys
    if command -v jq &> /dev/null; then
      jq 'del(.exports."0", .exports."1", .exports."2")' package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    cd - > /dev/null
  fi
done

# Process nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -d "$CLIENT_PKG/src" ]; then
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Standardizing exports for clients/$CLIENT_NAME..."
    cd "$CLIENT_PKG"
    
    # Backup package.json
    cp package.json package.json.bak
    
    # Standard export pattern
    npm pkg set "exports.."="{\"types\":\"./dist/index.d.ts\",\"import\":\"./dist/index.js\",\"require\":\"./dist/index.cjs\"}" "exports./package.json"="./package.json"
    
    # Check for jq to remove any malformed numeric keys
    if command -v jq &> /dev/null; then
      jq 'del(.exports."0", .exports."1", .exports."2")' package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    cd - > /dev/null
  fi
done

echo "✅ Package.json exports standardized" 