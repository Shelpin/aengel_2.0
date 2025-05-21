#!/bin/bash
set -e

echo "=== ElizaOS Package Verification ==="
echo "Verifying all packages can be imported correctly"

# Define the packages to test in the correct order
PACKAGES=( types core adapter-sqlite dynamic-imports plugin-bootstrap telegram-multiagent client-direct agent )

# Create a temporary directory for testing
TEMP_DIR=$(mktemp -d)
echo "Using temporary directory: $TEMP_DIR"

# Create package.json in temp dir
cat > "$TEMP_DIR/package.json" << JSON
{
  "name": "elizaos-verification",
  "type": "module",
  "private": true
}
JSON

# Function to test ESM import
test_esm_import() {
  local package=$1
  echo "Testing ESM import for @elizaos/$package..."
  
  cat > "$TEMP_DIR/esm-test.js" << JS
// ESM import test
import('@elizaos/$package').then(m => {
  console.log('✅ Successfully imported @elizaos/$package in ESM mode');
}).catch(error => {
  console.error('❌ Failed to import @elizaos/$package in ESM mode:', error);
  process.exit(1);
});
JS

  # Run the ESM test
  if node "$TEMP_DIR/esm-test.js"; then
    return 0
  else
    echo "❌ ESM import verification failed for @elizaos/$package"
    return 1
  fi
}

# Function to test CommonJS import
test_cjs_import() {
  local package=$1
  echo "Testing CommonJS import for @elizaos/$package..."
  
  cat > "$TEMP_DIR/cjs-test.cjs" << JS
// CommonJS import test
try {
  const pkg = require('@elizaos/$package');
  console.log('✅ Successfully imported @elizaos/$package in CommonJS mode');
} catch (error) {
  console.error('❌ Failed to import @elizaos/$package in CommonJS mode:', error);
  process.exit(1);
}
JS

  # Run the CommonJS test
  if node "$TEMP_DIR/cjs-test.cjs"; then
    return 0
  else
    echo "❌ CommonJS import verification failed for @elizaos/$package"
    return 1
  fi
}

# Track errors
FAILED=0

# Test each package
for package in "${PACKAGES[@]}"; do
  echo "---------------------------------"
  echo "Verifying @elizaos/$package"
  
  # Test both import styles
  if ! test_esm_import "$package"; then
    FAILED=$((FAILED+1))
  fi
  
  if ! test_cjs_import "$package"; then
    FAILED=$((FAILED+1))
  fi
done

# Clean up
echo "---------------------------------"
echo "Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

# Report results
echo "---------------------------------"
if [ $FAILED -eq 0 ]; then
  echo "✅ All package verifications passed!"
else
  echo "❌ $FAILED package verifications failed."
  exit 1
fi 