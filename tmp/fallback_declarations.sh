#!/bin/bash

# Create fallback declaration files for all packages
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && -d "$PKG/src" ]]; then
    echo "Creating fallbacks for $PKGNAME"
    cp tmp/minimal.d.ts.template "$PKG/index.d.ts"
    cp tmp/minimal.d.ts.template "$PKG/dist/index.d.ts"
    
    # Add public-api fallback if needed
    if [ -f "$PKG/src/public-api.ts" ]; then
      cp tmp/minimal.d.ts.template "$PKG/public-api.d.ts"
      cp tmp/minimal.d.ts.template "$PKG/dist/public-api.d.ts"
    fi
  fi
done

# Handle nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -d "$CLIENT_PKG/src" ]; then
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Creating fallbacks for clients/$CLIENT_NAME"
    cp tmp/minimal.d.ts.template "$CLIENT_PKG/index.d.ts"
    cp tmp/minimal.d.ts.template "$CLIENT_PKG/dist/index.d.ts"
  fi
done

echo "✅ Created fallback declaration files" 