#!/bin/bash

for PKG in packages/*/; do 
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && -d "$PKG/src" ]]; then 
    echo "Configuring $PKGNAME..."
    
    # Create backups
    if [ -f "$PKG/tsconfig.json" ]; then
      cp "$PKG/tsconfig.json" "$PKG/tsconfig.json.bak"
    fi
    
    if [ -f "$PKG/tsconfig.build.json" ]; then
      cp "$PKG/tsconfig.build.json" "$PKG/tsconfig.build.json.bak"
    fi
    
    # Apply templates
    cp tmp/tsconfig.build.template.json "$PKG/tsconfig.build.json"
    cp tmp/tsup.config.template.ts "$PKG/tsup.config.ts"
    
    # Create dist directory
    mkdir -p "$PKG/dist"
    
    echo "$PKGNAME configured successfully"
  fi
done

echo "✅ Config standardization complete" 