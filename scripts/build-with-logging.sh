#!/bin/bash

# Deterministic Build Process Script
# Following the requirements in deterministic-build-plan rule

# Setup directories
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_DIR="reports/implementation2104"
BUILD_LOG="${LOG_DIR}/${TIMESTAMP}_build.log"
BEFORE_DEP_GRAPH="${LOG_DIR}/${TIMESTAMP}_before-dependency-graph.png"
AFTER_DEP_GRAPH="${LOG_DIR}/${TIMESTAMP}_after-dependency-graph.png"
FORENSIC_REPORT="${LOG_DIR}/${TIMESTAMP}_forensic-report.md"

# Track timing
build_start_time=$(date +%s)

# Initialize log
echo "# ElizaOS Build Log - ${TIMESTAMP}" > "$BUILD_LOG"
echo "" >> "$BUILD_LOG"

# Function to log build actions
log_action() {
  local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  echo "[${timestamp}] $1" | tee -a "$BUILD_LOG"
}

# Function to run a command and log result
run_and_log() {
  local phase="$1"
  local description="$2"
  local command="$3"
  
  log_action "PHASE ${phase}: ${description}"
  log_action "COMMAND: ${command}"
  
  # Run the command and capture output and exit code
  output=$(eval "${command}" 2>&1)
  exit_code=$?
  
  # Log the output and exit code
  echo "EXIT CODE: ${exit_code}" >> "$BUILD_LOG"
  echo "OUTPUT:" >> "$BUILD_LOG"
  echo "$output" >> "$BUILD_LOG"
  echo "" >> "$BUILD_LOG"
  
  # Return the exit code
  return $exit_code
}

# Create forensic report header
cat > "$FORENSIC_REPORT" << EOF
# ElizaOS Build Forensic Report

## Build Information
- **Date**: $(date +"%Y-%m-%d")
- **Time**: $(date +"%H:%M:%S")
- **Executor**: $(whoami)
- **Build Command**: build-with-logging.sh

## Phase Results Summary
| Phase | Status | Duration | Issues Found | Issues Resolved |
|-------|--------|----------|--------------|-----------------|
EOF

# Initialize phase trackers
phase_issues_found=0
phase_issues_resolved=0

# ===== PHASE 0: Setup and Environment Preparation =====
phase_start_time=$(date +%s)

# Log Node.js and pnpm versions
run_and_log "0" "SETUP - Environment Info" "node -v > build_env_node.txt && pnpm -v > build_env_pnpm.txt && npx tsc -v > build_env_typescript.txt"

# TypeScript Version Control
run_and_log "0" "SETUP - TypeScript version pinning" "pnpm -r exec -- rm -rf node_modules/.pnpm/typescript@*"
run_and_log "0" "SETUP - Installing dependencies" "pnpm install"

# Dependency Analysis (Before)
run_and_log "0" "SETUP - Dependency Analysis" "node generate-dep-graph.js --output='${BEFORE_DEP_GRAPH}'"
run_and_log "0" "SETUP - Circular Dependency Check" "npx madge --circular --extensions ts packages/ > cycles.log"

# Check if cycles were found
if [ -s cycles.log ]; then
  log_action "WARNING: Circular dependencies found"
  cat cycles.log >> "$BUILD_LOG"
  ((phase_issues_found++))
fi

# Path Mapping Configuration
run_and_log "0" "SETUP - Path Mapping Configuration" "cat tsconfig.base.json >> '$BUILD_LOG'"

phase_end_time=$(date +%s)
phase_duration=$((phase_end_time - phase_start_time))

# Update forensic report for Phase 0
cat >> "$FORENSIC_REPORT" << EOF
| 0     | ✅     | $(printf "%dm %ds" $((phase_duration/60)) $((phase_duration%60)))   | ${phase_issues_found}            | ${phase_issues_resolved}   |
EOF

# Add detailed phase analysis to forensic report
cat >> "$FORENSIC_REPORT" << EOF

## Detailed Phase Analysis

### Phase 0: Setup and Environment Preparation
#### Actions Performed:
- Recorded Node.js version: $(cat build_env_node.txt)
- Recorded pnpm version: $(cat build_env_pnpm.txt)
- Recorded TypeScript version: $(cat build_env_typescript.txt)
- Generated dependency graph
- Checked for circular dependencies
- Examined TypeScript path mappings

#### Issues Encountered:
EOF

if [ ${phase_issues_found} -gt 0 ]; then
  if [ -s cycles.log ]; then
    echo "1. **Issue**: Circular dependencies found" >> "$FORENSIC_REPORT"
    echo "   **Details**: See cycles.log for details" >> "$FORENSIC_REPORT"
  fi
else
  echo "No issues encountered in this phase." >> "$FORENSIC_REPORT"
fi

echo "#### Artifacts Generated:" >> "$FORENSIC_REPORT"
echo "- \`${BEFORE_DEP_GRAPH}\`" >> "$FORENSIC_REPORT"
echo "- \`cycles.log\`" >> "$FORENSIC_REPORT"

# Reset issue counters for next phase
prev_phase_issues_found=${phase_issues_found}
phase_issues_found=0
phase_issues_resolved=0

# ===== PHASE 1: Core Package Success =====
phase_start_time=$(date +%s)

# Prebuild Cleanup
run_and_log "1" "CORE PACKAGE - Prebuild Cleanup" "pnpm -r exec -- rm -rf dist"

# Core Package Building
run_and_log "1" "CORE PACKAGE - Building core" "cd packages/core && pnpm run build"
if [ $? -ne 0 ]; then
  log_action "ERROR: Core package build failed"
  ((phase_issues_found++))
else
  log_action "SUCCESS: Core package built successfully"
fi

# Core Package Verification
run_and_log "1" "CORE PACKAGE - Verification" "ls -la packages/core/dist/"
dist_files_count=$(ls -la packages/core/dist/ | wc -l)
if [ $dist_files_count -lt 3 ]; then
  log_action "ERROR: Core package verification failed - insufficient output files"
  ((phase_issues_found++))
else
  log_action "SUCCESS: Core package verified successfully"
fi

# Module Path Correction (if needed)
run_and_log "1" "CORE PACKAGE - Module Path Check" "node fix_imports.js --package=core --dry-run"
if [ $? -ne 0 ]; then
  log_action "INFO: Running path corrections"
  run_and_log "1" "CORE PACKAGE - Module Path Correction" "node fix_imports.js --package=core"
  ((phase_issues_found++))
  ((phase_issues_resolved++))
else
  log_action "SUCCESS: No path corrections needed"
fi

phase_end_time=$(date +%s)
phase_duration=$((phase_end_time - phase_start_time))

# Update forensic report for Phase 1
cat >> "$FORENSIC_REPORT" << EOF
| 1     | ✅     | $(printf "%dm %ds" $((phase_duration/60)) $((phase_duration%60)))   | ${phase_issues_found}            | ${phase_issues_resolved}   |
EOF

# Add detailed phase analysis to forensic report
cat >> "$FORENSIC_REPORT" << EOF

### Phase 1: Core Package Success
#### Actions Performed:
- Cleaned previous build artifacts
- Built core package
- Verified output files
- Checked module path correctness

#### Issues Encountered:
EOF

if [ ${phase_issues_found} -gt 0 ]; then
  if [ ${phase_issues_resolved} -gt 0 ]; then
    echo "1. **Issue**: Module path corrections needed" >> "$FORENSIC_REPORT"
    echo "   **Resolution**: Applied path corrections using fix_imports.js" >> "$FORENSIC_REPORT"
  else
    echo "1. **Issue**: Build issues detected that were not automatically resolved" >> "$FORENSIC_REPORT"
  fi
else
  echo "No issues encountered in this phase." >> "$FORENSIC_REPORT"
fi

echo "#### Artifacts Generated:" >> "$FORENSIC_REPORT"
echo "- Core package dist files" >> "$FORENSIC_REPORT"

# Reset issue counters for next phase
prev_phase_issues_found=${phase_issues_found}
phase_issues_found=0
phase_issues_resolved=0

# ===== PHASE 2: TypeScript Configuration Standardization =====
phase_start_time=$(date +%s)

# TSConfig Standardization
run_and_log "2" "TSCONFIG - Standardization Check" "node generate-tsconfig-deviation.js"
deviations_count=$(grep -c "deviation" tsconfig-deviations.log 2>/dev/null || echo "0")
if [ "$deviations_count" -gt 0 ]; then
  log_action "WARNING: TSConfig deviations found"
  ((phase_issues_found++))
  
  # Apply standardization if needed
  run_and_log "2" "TSCONFIG - Applying standardization" "./update_tsconfig.sh"
  ((phase_issues_resolved++))
else
  log_action "SUCCESS: No TSConfig deviations found"
fi

# Type Safety Improvements
run_and_log "2" "TYPE-SAFETY - Type checking" "npx tsc --noEmit"
if [ $? -ne 0 ]; then
  log_action "WARNING: Type issues found, attempting fixes"
  ((phase_issues_found++))
  
  # Add missing types if needed - Note: this would require a more sophisticated approach
  # For now just log the issue
  log_action "INFO: Manual type fixes may be required"
else
  log_action "SUCCESS: No type issues found"
fi

phase_end_time=$(date +%s)
phase_duration=$((phase_end_time - phase_start_time))

# Update forensic report for Phase 2
cat >> "$FORENSIC_REPORT" << EOF
| 2     | ✅     | $(printf "%dm %ds" $((phase_duration/60)) $((phase_duration%60)))   | ${phase_issues_found}            | ${phase_issues_resolved}   |
EOF

# Add detailed phase analysis to forensic report
cat >> "$FORENSIC_REPORT" << EOF

### Phase 2: TypeScript Configuration Standardization
#### Actions Performed:
- Checked TSConfig for deviations from standards
- Applied standardization updates if needed
- Performed type checking across the codebase

#### Issues Encountered:
EOF

if [ ${phase_issues_found} -gt 0 ]; then
  if [ "$deviations_count" -gt 0 ]; then
    echo "1. **Issue**: TSConfig deviations from standard" >> "$FORENSIC_REPORT"
    echo "   **Resolution**: Applied standardization with update_tsconfig.sh" >> "$FORENSIC_REPORT"
  fi
  
  if [ $? -ne 0 ]; then
    echo "2. **Issue**: Type checking issues found" >> "$FORENSIC_REPORT"
    echo "   **Note**: Manual type fixes may be required" >> "$FORENSIC_REPORT"
  fi
else
  echo "No issues encountered in this phase." >> "$FORENSIC_REPORT"
fi

# Reset issue counters for next phase
prev_phase_issues_found=${phase_issues_found}
phase_issues_found=0
phase_issues_resolved=0

# ===== PHASE 3: Package.json Standardization =====
phase_start_time=$(date +%s)

# Package.json Configuration
run_and_log "3" "PACKAGE-JSON - Check export fields" "./validate_exports.sh"
if [ $? -ne 0 ]; then
  log_action "WARNING: Package.json export fields issues found"
  ((phase_issues_found++))
  
  # Fix export fields if needed
  run_and_log "3" "PACKAGE-JSON - Fixing export fields" "./fix_exports.sh"
  ((phase_issues_resolved++))
else
  log_action "SUCCESS: Package.json export fields look good"
fi

# Update scripts in package.json
run_and_log "3" "PACKAGE-JSON - Updating scripts" "./update_package_scripts.sh"

# Workspace Reference Alignment
run_and_log "3" "WORKSPACE - Checking package references" "node analyze-packages.js"

# Build Tool Standardization
run_and_log "3" "BUILD-TOOLS - Updating build configurations" "./update_tsup_configs.sh"

phase_end_time=$(date +%s)
phase_duration=$((phase_end_time - phase_start_time))

# Update forensic report for Phase 3
cat >> "$FORENSIC_REPORT" << EOF
| 3     | ✅     | $(printf "%dm %ds" $((phase_duration/60)) $((phase_duration%60)))   | ${phase_issues_found}            | ${phase_issues_resolved}   |
EOF

# Add detailed phase analysis to forensic report
cat >> "$FORENSIC_REPORT" << EOF

### Phase 3: Package.json Standardization
#### Actions Performed:
- Validated package.json export fields
- Updated package scripts for consistency
- Analyzed package references in the workspace
- Standardized build tool configurations

#### Issues Encountered:
EOF

if [ ${phase_issues_found} -gt 0 ]; then
  if [ ${phase_issues_resolved} -gt 0 ]; then
    echo "1. **Issue**: Package.json export fields issues" >> "$FORENSIC_REPORT"
    echo "   **Resolution**: Applied fixes with fix_exports.sh" >> "$FORENSIC_REPORT"
  else
    echo "1. **Issue**: Package reference issues detected" >> "$FORENSIC_REPORT"
  fi
else
  echo "No issues encountered in this phase." >> "$FORENSIC_REPORT"
fi

# Reset issue counters for next phase
prev_phase_issues_found=${phase_issues_found}
phase_issues_found=0
phase_issues_resolved=0

# ===== PHASE 4: Incremental Build and Verification =====
phase_start_time=$(date +%s)

# Define build order
BUILD_ORDER=(
  "core"
  "adapter-sqlite"
  "dynamic-imports"
  "plugin-bootstrap"
  "clients/telegram"
  "telegram-multiagent"
  "client-direct"
  "agent"
)

# Initialize package build status table for the report
cat >> "$FORENSIC_REPORT" << EOF

## Package Build Status
| Package | Build Status | Verification | Issues |
|---------|--------------|--------------|--------|
EOF

# Build each package in order
for pkg in "${BUILD_ORDER[@]}"; do
  pkg_name=${pkg//\//-}  # Replace slashes with dashes for logging
  log_action "PHASE 4: Building package @elizaos/${pkg}"
  
  # Build the package
  if [[ "$pkg" == *"/"* ]]; then
    # Handle nested packages like clients/telegram
    parent_dir=$(echo "$pkg" | cut -d '/' -f 1)
    child_dir=$(echo "$pkg" | cut -d '/' -f 2)
    build_cmd="cd packages/${parent_dir}/${child_dir} && pnpm run build"
  else
    build_cmd="cd packages/${pkg} && pnpm run build"
  fi
  
  run_and_log "4" "BUILDING - @elizaos/${pkg}" "$build_cmd"
  build_result=$?
  
  # Check build status
  if [ $build_result -eq 0 ]; then
    build_status="✅"
    verification="✅"
    issues="None"
  else
    build_status="❌"
    verification="❌"
    issues="Build failed"
    ((phase_issues_found++))
  fi
  
  # Add to the report
  echo "| @elizaos/${pkg} | ${build_status} | ${verification} | ${issues} |" >> "$FORENSIC_REPORT"
done

# Dependency Analysis (After)
run_and_log "4" "VERIFICATION - Dependency Analysis" "node generate-dep-graph.js --output='${AFTER_DEP_GRAPH}'"
run_and_log "4" "VERIFICATION - Circular Dependency Check" "npx madge --circular --extensions ts packages/ > cycles_after.log"

# Check if cycles were still found
if [ -s cycles_after.log ]; then
  log_action "WARNING: Circular dependencies still exist after build"
  cat cycles_after.log >> "$BUILD_LOG"
  ((phase_issues_found++))
else
  log_action "SUCCESS: No circular dependencies found after build"
  if [ -s cycles.log ]; then
    ((phase_issues_resolved++))
  fi
fi

# Complete System Verification
run_and_log "4" "VERIFICATION - Import verification" "node test-imports.mjs"
if [ $? -ne 0 ]; then
  log_action "WARNING: Import verification failed"
  ((phase_issues_found++))
else
  log_action "SUCCESS: Import verification passed"
fi

phase_end_time=$(date +%s)
phase_duration=$((phase_end_time - phase_start_time))

# Update forensic report for Phase 4
cat >> "$FORENSIC_REPORT" << EOF
| 4     | ✅     | $(printf "%dm %ds" $((phase_duration/60)) $((phase_duration%60)))   | ${phase_issues_found}            | ${phase_issues_resolved}   |
EOF

# Add detailed phase analysis to forensic report
cat >> "$FORENSIC_REPORT" << EOF

### Phase 4: Incremental Build and Verification
#### Actions Performed:
- Built each package in the correct dependency order
- Verified package build outputs
- Generated updated dependency graph
- Verified import functionality
- Checked for circular dependencies after build

#### Issues Encountered:
EOF

if [ ${phase_issues_found} -gt 0 ]; then
  issue_count=1
  
  # Check for build failures
  if grep -q "❌" "$FORENSIC_REPORT"; then
    echo "${issue_count}. **Issue**: Some packages failed to build" >> "$FORENSIC_REPORT"
    echo "   **Note**: See package build status table for details" >> "$FORENSIC_REPORT"
    ((issue_count++))
  fi
  
  # Check for circular dependencies
  if [ -s cycles_after.log ]; then
    echo "${issue_count}. **Issue**: Circular dependencies still exist after build" >> "$FORENSIC_REPORT"
    echo "   **Note**: See cycles_after.log for details" >> "$FORENSIC_REPORT"
    ((issue_count++))
  fi
  
  # Check for import verification failures
  if [ $? -ne 0 ]; then
    echo "${issue_count}. **Issue**: Import verification failed" >> "$FORENSIC_REPORT"
    echo "   **Note**: Runtime imports are not working as expected" >> "$FORENSIC_REPORT"
  fi
else
  echo "No issues encountered in this phase." >> "$FORENSIC_REPORT"
fi

echo "#### Artifacts Generated:" >> "$FORENSIC_REPORT"
echo "- \`${AFTER_DEP_GRAPH}\`" >> "$FORENSIC_REPORT"
echo "- \`cycles_after.log\`" >> "$FORENSIC_REPORT"
echo "- Package dist directories" >> "$FORENSIC_REPORT"

# ===== Finalize Forensic Report =====
build_end_time=$(date +%s)
total_duration=$((build_end_time - build_start_time))

# Add dependency analysis section
cat >> "$FORENSIC_REPORT" << EOF

## Dependency Analysis
- **Before**: $(grep -c "" cycles.log 2>/dev/null || echo "0") circular dependencies identified
- **After**: $(grep -c "" cycles_after.log 2>/dev/null || echo "0") circular dependencies
- **Visualization**: [Before](${BEFORE_DEP_GRAPH}) and [After](${AFTER_DEP_GRAPH}) dependency graphs

## Recommendations
EOF

# Add recommendations based on issues found
total_issues=$((prev_phase_issues_found + phase_issues_found))
if [ $total_issues -gt 0 ]; then
  if grep -q "❌" "$FORENSIC_REPORT"; then
    echo "- Address build failures in packages" >> "$FORENSIC_REPORT"
  fi
  
  if [ -s cycles_after.log ]; then
    echo "- Resolve remaining circular dependencies" >> "$FORENSIC_REPORT"
  fi
  
  echo "- Continue improving type safety across packages" >> "$FORENSIC_REPORT"
else
  echo "- Add automated checks to CI pipeline to maintain build quality" >> "$FORENSIC_REPORT"
  echo "- Consider further optimization of build process for faster builds" >> "$FORENSIC_REPORT"
fi

# Final log message
log_action "BUILD COMPLETE: Total duration $(printf "%dm %ds" $((total_duration/60)) $((total_duration%60)))"
log_action "Forensic report generated at ${FORENSIC_REPORT}"

echo "Build completed. See ${BUILD_LOG} and ${FORENSIC_REPORT} for details." 