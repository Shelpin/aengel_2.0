#!/bin/bash

for PKG in packages/*/; do
  if [ -d "$PKG" ] && [ "$PKG" != "packages/core/" ]; then
    echo "Creating tsconfig.build.json for $PKG"
    cat > "$PKG/tsconfig.build.json" << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "emitDeclarationOnly": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
EOF
  fi
done 