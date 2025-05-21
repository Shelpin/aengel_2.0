#!/bin/bash
# Clean build script that builds packages in the correct dependency order

set -e  # Exit on error

# Define build order based on dependency graph
ORDER=( types core adapter-sqlite dynamic-imports plugin-bootstrap clients/telegram telegram-multiagent client-direct agent )

# Create build logs directory
LOGS_DIR="reports/build_output"
mkdir -p "$LOGS_DIR"

log() {
    echo "[$(date '+%F %T')] $1"
}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Counters
PACKAGES_BUILT=0
PACKAGES_FAILED=0
FAILED_PACKAGES=()

# Print header
echo "===== ElizaOS Build Script ====="
echo "Building packages in dependency order: ${ORDER[*]}"
echo ""

# Function to build a package
build_package() {
  local package=$1
  log "Building @elizaos/${package}"
  
  if pnpm --filter "@elizaos/${package}" run build; then
    log "Successfully built @elizaos/${package}"
    PACKAGES_BUILT=$((PACKAGES_BUILT + 1))
    return 0
  else
    log "ERROR: Failed to build @elizaos/${package}"
    PACKAGES_FAILED=$((PACKAGES_FAILED + 1))
    FAILED_PACKAGES+=("$package")
    return 1
  fi
}

# Main build loop
for p in "${ORDER[@]}"; do
  if ! build_package "$p"; then
    log "Aborting build due to failure in @elizaos/${p}"
    exit 1
  fi
done

# Print summary
echo "===== Build Summary ====="
echo -e "${GREEN}Packages built successfully: $PACKAGES_BUILT${NC}"

if [ $PACKAGES_FAILED -gt 0 ]; then
  echo -e "${RED}Packages failed: $PACKAGES_FAILED${NC}"
  echo -e "${RED}Failed packages: ${FAILED_PACKAGES[*]}${NC}"
  exit 1
else
  log "All packages built successfully!"
  exit 0
fi 