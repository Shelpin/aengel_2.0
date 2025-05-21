#!/bin/bash

# Script to fix .ts extensions in import paths in the ElizaOS monorepo

echo "Fixing .ts extensions in import paths in the core package..."

# Create a backup of the src directory
echo "Creating backup of src directory..."
cp -r /root/eliza/packages/core/src /root/eliza/packages/core/src.bak

# Find and replace .ts extensions in import paths
find /root/eliza/packages/core/src -name "*.ts" -type f -exec sed -i 's/from "\(.*\)\.ts"/from "\1"/g' {} \;
find /root/eliza/packages/core/src -name "*.ts" -type f -exec sed -i "s/from '\(.*\)\.ts'/from '\1'/g" {} \;

echo "Fixed .ts extensions in import paths in the core package"
echo "Backup of original files is available at /root/eliza/packages/core/src.bak" 