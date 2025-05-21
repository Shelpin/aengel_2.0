#!/bin/bash

# Check and fix tsconfig extends issues
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "core" && "$PKGNAME" != "characters" && -f "$PKG/tsconfig.json" ]]; then
    # Check for references to ../core/tsconfig.json
    if grep -q '"extends": "../core/tsconfig.json"' "$PKG/tsconfig.json"; then
      echo "Fixing tsconfig extends in $PKGNAME..."
      sed -i 's/"extends": "..\/core\/tsconfig.json"/"extends": ".\/tsconfig.build.json"/g' "$PKG/tsconfig.json"
    fi
  fi
done

# Fix nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -f "$CLIENT_PKG/tsconfig.json" ]; then
    # Check for references to ../../core/tsconfig.json
    if grep -q '"extends": "../../core/tsconfig.json"' "$CLIENT_PKG/tsconfig.json"; then
      CLIENT_NAME=$(basename $CLIENT_PKG)
      echo "Fixing tsconfig extends in clients/$CLIENT_NAME..."
      sed -i 's/"extends": "..\/..\/core\/tsconfig.json"/"extends": ".\/tsconfig.build.json"/g' "$CLIENT_PKG/tsconfig.json"
    fi
  fi
done

echo "✅ tsconfig extends issues fixed" 