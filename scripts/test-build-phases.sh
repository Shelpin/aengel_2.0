#!/usr/bin/env bash
set -euo pipefail

# Test script to run just a few phases of the build plan
# This will help us test the build process step by step

# Initialize log directory
LOG_DIR="reports/build_output"
mkdir -p "$LOG_DIR"

echo "====== ElizaOS Test Build ======"
echo "Starting execution of phases 5-7"

# Phase 5: Fix import paths
echo -e "\n=== Phase 5: Fix import paths ==="
node scripts/fix-import-extensions.js --write

# Phase 6: Detect circular dependencies
echo -e "\n=== Phase 6: Detect circular dependencies ==="
node scripts/detect-cycles.js

# Phase 7: Update package.json exports
echo -e "\n=== Phase 7: Update package.json exports ==="
node scripts/fix-exports.js --write

echo -e "\n====== Test Build Complete ======" 