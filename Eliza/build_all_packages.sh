#!/bin/bash

# Go to project root
cd "$(dirname "$0")/.."
WORKSPACE_ROOT=$(pwd)

# Create DBIG directory if it doesn't exist
mkdir -p "${WORKSPACE_ROOT}/Eliza/DBIG"

# Create log file
BUILD_LOG="${WORKSPACE_ROOT}/Eliza/DBIG/build_logs.log"
touch "$BUILD_LOG"

echo "=== ElizaOS Package Build Logs ===" > "$BUILD_LOG"
echo "Build started at: $(date)" >> "$BUILD_LOG"
echo "Working from directory: $WORKSPACE_ROOT" >> "$BUILD_LOG"
echo "" >> "$BUILD_LOG"

# Run a single build for all packages
echo "=== Building all packages using pnpm ===" | tee -a "$BUILD_LOG"
pnpm -r run build 2>&1 | tee -a "$BUILD_LOG"
BUILD_EXIT_STATUS=$?
echo "Build exit status: $BUILD_EXIT_STATUS" | tee -a "$BUILD_LOG"
echo "" | tee -a "$BUILD_LOG"

echo "Build completed at: $(date)" >> "$BUILD_LOG"

# Summary section
echo "=== Build Summary ===" | tee -a "$BUILD_LOG"
echo "Checking for .d.ts files in dist directories:" | tee -a "$BUILD_LOG"

# List all packages
echo "Packages found:" | tee -a "$BUILD_LOG"
find "$WORKSPACE_ROOT/packages" -maxdepth 1 -type d | grep -v "^$WORKSPACE_ROOT/packages$" | while read -r pkg_dir; do
  pkg_name=$(basename "$pkg_dir")
  echo "- $pkg_name" | tee -a "$BUILD_LOG"
done

echo "" | tee -a "$BUILD_LOG"

# Check .d.ts files
find "$WORKSPACE_ROOT/packages" -maxdepth 1 -type d | grep -v "^$WORKSPACE_ROOT/packages$" | while read -r pkg_dir; do
  pkg_name=$(basename "$pkg_dir")
  dist_dir="$pkg_dir/dist"
  
  if [ -d "$dist_dir" ]; then
    d_ts_count=$(find "$dist_dir" -name "*.d.ts" -type f 2>/dev/null | wc -l)
    echo "$pkg_name: $d_ts_count .d.ts files found" | tee -a "$BUILD_LOG"
    
    if [ "$d_ts_count" -gt 0 ]; then
      echo "  First 10 d.ts files:" | tee -a "$BUILD_LOG"
      find "$dist_dir" -name "*.d.ts" -type f 2>/dev/null | head -10 | while read -r ts_file; do
        rel_path=${ts_file#"$pkg_dir/"}
        echo "  - $rel_path" | tee -a "$BUILD_LOG"
      done
    fi
  else
    echo "$pkg_name: No dist directory found" | tee -a "$BUILD_LOG"
  fi
  echo "" | tee -a "$BUILD_LOG"
done

echo "Build process complete. Logs saved to $BUILD_LOG" 