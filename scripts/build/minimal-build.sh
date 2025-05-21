#!/bin/bash
# Minimal build script that builds just the essential packages

set -e  # Exit on error

# Define build order based on dependency graph
ORDER=( types adapter-sqlite )

# Create build logs directory
LOGS_DIR="reports/build_output"
mkdir -p "$LOGS_DIR"

log() {
    echo "[$(date '+%F %T')] $1"
}

# Print header
echo "===== ElizaOS Minimal Build Script ====="
echo "Building essential packages: ${ORDER[*]}"
echo ""

# Build the packages
for p in "${ORDER[@]}"; do
  log "Building @elizaos/${p}"
  
  if cd "packages/${p}" && pnpm run build; then
    log "Successfully built @elizaos/${p}"
    cd ../..
  else
    log "ERROR: Failed to build @elizaos/${p}"
    cd ../..
    exit 1
  fi
done

log "All packages built successfully!"
exit 0 