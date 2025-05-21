#!/bin/bash

echo "Checking and fixing tsconfig extends issues..."

# Fix any tsconfig extends issues 
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "core" && "$PKGNAME" != "characters" && "$PKGNAME" != "plugin-multiagent-coordinator" ]]; then
    if [ -f "$PKG/tsconfig.json" ]; then
      # If any package extends ../core/tsconfig.json, fix it to use local tsconfig
      if grep -q '"extends": "../core/tsconfig.json"' $PKG/tsconfig.json; then
        echo "Fixing tsconfig extends in $PKG..."
        # Backup original
        cp $PKG/tsconfig.json $PKG/tsconfig.json.bak
        sed -i 's/"extends": "..\/core\/tsconfig.json"/"extends": ".\/tsconfig.build.json"/g' $PKG/tsconfig.json
      fi
    fi
  fi
done

# Special handling for nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -f "$CLIENT_PKG/tsconfig.json" ]; then
    # Check if it extends ../../core/tsconfig.json
    if grep -q '"extends": "../../core/tsconfig.json"' $CLIENT_PKG/tsconfig.json; then
      echo "Fixing tsconfig extends in $CLIENT_PKG..."
      cp $CLIENT_PKG/tsconfig.json $CLIENT_PKG/tsconfig.json.bak
      sed -i 's/"extends": "..\/..\/core\/tsconfig.json"/"extends": ".\/tsconfig.build.json"/g' $CLIENT_PKG/tsconfig.json
    fi
  fi
done

echo "✅ tsconfig extends issues fixed" 