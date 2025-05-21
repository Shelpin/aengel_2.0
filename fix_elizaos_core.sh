#!/bin/bash

# Script to build and link the @elizaos/core package to fix the patch error
set -e  # Exit on error

echo "🔧 Fixing @elizaos/core dependency for patches..."

# Navigate to core package directory
echo "📂 Navigating to core package directory..."
cd /root/eliza/packages/core

# Build the core package
echo "🏗️ Building @elizaos/core package..."
pnpm build

# Create a link for the core package
echo "🔗 Creating link for @elizaos/core..."
pnpm link --global

# Go back to root
cd /root/eliza

# Link the core package in the root project
echo "🔗 Linking @elizaos/core in the root project..."
pnpm link --global @elizaos/core

# Create a patch directory package.json if it doesn't exist
if [ ! -f "/root/eliza/patches/package.json" ]; then
  echo "📝 Creating package.json in patches directory..."
  cat > /root/eliza/patches/package.json << EOF
{
  "name": "elizaos-patches",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "dependencies": {
    "@elizaos/core": "*"
  }
}
EOF
fi

# Navigate to the patches directory
cd /root/eliza/patches

# Install dependencies in the patches directory
echo "📦 Installing dependencies in patches directory..."
pnpm install

# Link the core package in the patches directory
echo "🔗 Linking @elizaos/core in patches directory..."
pnpm link --global @elizaos/core

echo "✅ @elizaos/core dependency fix complete!"
echo "🚀 You can now run the system with the following command:"
echo "   ./fix_and_restart.sh" 