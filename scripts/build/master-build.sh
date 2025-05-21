#!/bin/bash
# Master build script for ElizaOS packages
# Runs all standardization steps and then builds the packages

set -e  # Exit on error

echo "=== PHASE 1: Setup ==="
# Create reports directory
mkdir -p reports/build_output
LOG_FILE="reports/build_output/build.log"
echo "$(date '+%F %T') Starting build process" | tee $LOG_FILE

# Check if dependencies are installed
echo "Checking dependencies..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm." | tee -a $LOG_FILE
    exit 1
fi

echo "=== PHASE 2: Dependency Analysis ==="
# Check for circular dependencies
echo "Checking for circular dependencies..." | tee -a $LOG_FILE
node scripts/build/check-cycles.js | tee -a $LOG_FILE

echo "=== PHASE 3: Standardizing Configs ==="
# Run standardization scripts
echo "Standardizing package.json files..." | tee -a $LOG_FILE
node scripts/build/standardize-package-scripts.js | tee -a $LOG_FILE

echo "Standardizing tsconfig.build.json files..." | tee -a $LOG_FILE
node scripts/build/standardize-tsconfig.js | tee -a $LOG_FILE

echo "=== PHASE 4: Installing Dependencies ==="
echo "Installing dependencies..." | tee -a $LOG_FILE
pnpm install | tee -a $LOG_FILE

# Install rimraf if not already present
if ! pnpm list rimraf &> /dev/null; then
    echo "Installing rimraf..." | tee -a $LOG_FILE
    pnpm add -D rimraf | tee -a $LOG_FILE
fi

echo "=== PHASE 5: Building Packages ==="
echo "Building packages in dependency order..." | tee -a $LOG_FILE

# Run the clean build script
bash scripts/build/clean-build.sh | tee -a $LOG_FILE

echo "=== PHASE 6: Verification ==="
echo "Verifying built packages..." | tee -a $LOG_FILE
node scripts/build/verify-packages.js | tee -a $LOG_FILE

if [ $? -eq 0 ]; then
    echo "=== PHASE 7: Final Report ==="
    echo "Generating final build report..." | tee -a $LOG_FILE
    
    # Check for circular dependencies again to ensure they were resolved
    echo "Verifying no circular dependencies remain..." | tee -a $LOG_FILE
    node scripts/build/check-cycles.js | tee -a $LOG_FILE
    
    echo "✅ BUILD SUCCESSFUL!" | tee -a $LOG_FILE
    echo "$(date '+%F %T') Build process completed successfully" | tee -a $LOG_FILE
    
    # Generate a simple build report
    REPORT_FILE="reports/build_output/build-report.md"
    echo "# Build Report - $(date '+%F %T')" > $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "## Summary" >> $REPORT_FILE
    echo "- Status: ✅ SUCCESS" >> $REPORT_FILE
    echo "- Date: $(date '+%F %T')" >> $REPORT_FILE
    echo "- Duration: (calculated from log timestamps)" >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "## Packages Built" >> $REPORT_FILE
    grep "Package built successfully" $LOG_FILE | sed 's/^/- /' >> $REPORT_FILE
    echo "" >> $REPORT_FILE
    echo "## Verification Results" >> $REPORT_FILE
    grep "Successfully imported" $LOG_FILE | sed 's/^/- /' >> $REPORT_FILE
    
    echo "Build report generated at $REPORT_FILE" | tee -a $LOG_FILE
    exit 0
else
    echo "❌ BUILD FAILED! See logs for details." | tee -a $LOG_FILE
    echo "$(date '+%F %T') Build process failed" | tee -a $LOG_FILE
    exit 1
fi 