#!/bin/bash

# Apply templates to active packages
echo "Applying config templates to active packages..."
for PKG in packages/*/; do 
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && "$PKGNAME" != "plugin-multiagent-coordinator" ]]; then 
    echo "Standardizing build config for $PKG..."
    
    # Check if source directory exists
    if [ ! -d "$PKG/src" ]; then
      echo "⚠️ Warning: No src directory found in $PKG, skipping..."
      continue
    fi
    
    # Create backup of original configs
    if [ -f "$PKG/tsconfig.json" ]; then
      cp "$PKG/tsconfig.json" "$PKG/tsconfig.json.bak"
    fi
    
    if [ -f "$PKG/tsconfig.build.json" ]; then
      cp "$PKG/tsconfig.build.json" "$PKG/tsconfig.build.json.bak"
    fi
    
    # Apply new configs
    cp tsconfig.build.template.json $PKG/tsconfig.build.json
    
    # If it's the core package, create specialized tsup config
    if [[ "$PKGNAME" == "core" ]]; then
      echo 'import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts", "src/public-api.ts"],
  dts: false,
  format: ["esm", "cjs"],
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["fs", "path", "http", "https"]
});' > $PKG/tsup.config.ts
      
      # Also update base tsconfig.json for core
      cp tsconfig.core.template.json $PKG/tsconfig.json
    else
      cp tsup.config.template.ts $PKG/tsup.config.ts
    fi
    
    # Set prebuild script with enhanced cleanup
    cd $PKG
    npm pkg set "scripts.prebuild"="rimraf dist && find . -name '*.d.ts' -o -name '*.ts' | grep dist | xargs rm -f 2>/dev/null || true"
    cd ../..
  fi
done

# Special handling for nested client packages
if [ -d "packages/clients/telegram" ]; then
  echo "Handling nested client packages..."
  
  for CLIENT_PKG in packages/clients/*/; do
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Standardizing config for client package: $CLIENT_NAME"
    
    if [ -d "$CLIENT_PKG/src" ]; then
      # Apply configs
      cp tsconfig.build.template.json $CLIENT_PKG/tsconfig.build.json
      cp tsup.config.template.ts $CLIENT_PKG/tsup.config.ts
      
      # Set prebuild script
      cd $CLIENT_PKG
      npm pkg set "scripts.prebuild"="rimraf dist && find . -name '*.d.ts' -o -name '*.ts' | grep dist | xargs rm -f 2>/dev/null || true"
      cd ../../../
    else
      echo "⚠️ Warning: No src directory in $CLIENT_PKG, skipping..."
    fi
  done
fi

echo "✅ Config standardization complete" 