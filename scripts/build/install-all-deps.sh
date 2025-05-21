#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Installing dependencies across all packages${NC}"

# First install all dependencies
echo -e "${YELLOW}Installing root dependencies${NC}"
pnpm install

# Build types package first
echo -e "${YELLOW}Building @elizaos/types package${NC}"
cd packages/types
pnpm install
npm link
cd ../..

# Link types to all dependent packages
echo -e "${YELLOW}Linking @elizaos/types to dependent packages${NC}"
for dir in packages/*; do
  if [ -d "$dir" ] && [ "$dir" != "packages/types" ]; then
    echo -e "${YELLOW}Linking @elizaos/types to $dir${NC}"
    cd "$dir"
    npm link @elizaos/types
    cd ../..
  fi
done

# Create tsconfig.json files that reference types package
echo -e "${YELLOW}Creating tsconfig references${NC}"
node scripts/build/create-tsconfig-references.js

echo -e "${GREEN}All dependencies installed and linked successfully${NC}" 