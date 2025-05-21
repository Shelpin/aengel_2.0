#!/bin/bash

# Handle special case for nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -d "$CLIENT_PKG" ]; then
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Configuring client/$CLIENT_NAME..."
    
    # Create backups
    if [ -f "$CLIENT_PKG/tsconfig.json" ]; then
      cp "$CLIENT_PKG/tsconfig.json" "$CLIENT_PKG/tsconfig.json.bak"
    fi
    
    if [ -f "$CLIENT_PKG/tsconfig.build.json" ]; then
      cp "$CLIENT_PKG/tsconfig.build.json" "$CLIENT_PKG/tsconfig.build.json.bak"
    fi
    
    # Apply templates
    if [ -d "$CLIENT_PKG/src" ]; then
      cp tmp/tsconfig.build.template.json "$CLIENT_PKG/tsconfig.build.json"
      cp tmp/tsup.config.template.ts "$CLIENT_PKG/tsup.config.ts"
      
      # Create dist directory preemptively
      mkdir -p "$CLIENT_PKG/dist"
      
      echo "$CLIENT_NAME configured successfully"
    else
      echo "$CLIENT_NAME skipped (no src directory)"
    fi
  fi
done

echo "✅ Client packages configuration complete" 