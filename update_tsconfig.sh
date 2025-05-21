#!/bin/bash
for pkg in packages/*; do
  if [ -f "$pkg/tsconfig.build.json" ]; then
    echo "Updating $pkg/tsconfig.build.json"
    
    # Add/verify declaration directory settings
    jq '.compilerOptions.declarationDir = "dist"' "$pkg/tsconfig.build.json" > "$pkg/tsconfig.build.json.tmp" && mv "$pkg/tsconfig.build.json.tmp" "$pkg/tsconfig.build.json"
    
    # Ensure exclude array exists
    jq 'if has("exclude") then . else . + {"exclude": []} end' "$pkg/tsconfig.build.json" > "$pkg/tsconfig.build.json.tmp" && mv "$pkg/tsconfig.build.json.tmp" "$pkg/tsconfig.build.json"
    
    # Add dist to exclude if not already present
    jq '.exclude = if type == "array" then (if contains(["dist"]) then . else . + ["dist"] end) else ["dist"] end' "$pkg/tsconfig.build.json" > "$pkg/tsconfig.build.json.tmp" && mv "$pkg/tsconfig.build.json.tmp" "$pkg/tsconfig.build.json"
    
    # Add **/*.d.ts to exclude if not already present
    jq '.exclude = if type == "array" then (if contains(["**/*.d.ts"]) then . else . + ["**/*.d.ts"] end) else ["**/*.d.ts"] end' "$pkg/tsconfig.build.json" > "$pkg/tsconfig.build.json.tmp" && mv "$pkg/tsconfig.build.json.tmp" "$pkg/tsconfig.build.json"
    
    # Add node_modules to exclude if not already present
    jq '.exclude = if type == "array" then (if contains(["node_modules"]) then . else . + ["node_modules"] end) else ["node_modules"] end' "$pkg/tsconfig.build.json" > "$pkg/tsconfig.build.json.tmp" && mv "$pkg/tsconfig.build.json.tmp" "$pkg/tsconfig.build.json"
  fi
done 