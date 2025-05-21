#!/usr/bin/env bash
set -euo pipefail

# Master script to execute all phases of the deterministic build plan
# Usage: ./scripts/execute-build-plan.sh [--continue-from <phase>] [--skip-phase <phase>]

# Parse arguments
CONTINUE_FROM=0
SKIP_PHASES=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --continue-from)
      CONTINUE_FROM="$2"
      shift 2
      ;;
    --skip-phase)
      SKIP_PHASES+=("$2")
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./scripts/execute-build-plan.sh [--continue-from <phase>] [--skip-phase <phase>]"
      exit 1
      ;;
  esac
done

# Initialize log directory
LOG_DIR="reports/build_output"
mkdir -p "$LOG_DIR"

# Function to check if a phase should be skipped
should_skip_phase() {
  local phase=$1
  for skip_phase in "${SKIP_PHASES[@]:-}"; do
    if [[ "$skip_phase" == "$phase" ]]; then
      return 0
    fi
  done
  return 1
}

# Function to run a phase
run_phase() {
  local phase="$1"
  local desc="$2"
  local cmd="$3"
  
  if [[ $phase -lt $CONTINUE_FROM ]]; then
    echo "Skipping Phase $phase: $desc (continuing from phase $CONTINUE_FROM)"
    return 0
  fi
  
  if should_skip_phase "$phase"; then
    echo "Skipping Phase $phase: $desc (explicitly skipped)"
    return 0
  fi
  
  # Explicitly invoke bash to run the script with all arguments
  bash ./scripts/run_step.sh "$phase" "$desc" "$cmd"
}

# Header
echo "======================================================"
echo "ElizaOS Deterministic Build Plan Execution"
echo "Started at: $(date)"
echo "======================================================"

# Phase 0: Preparation
run_phase 0 "Preparation & snapshot" "
mkdir -p reports/build_output && 
npx madge --circular --extensions ts packages/ | tee reports/build_output/cycles-before.log
"

# Phase 1: Types package is already created
run_phase 1 "Verify @elizaos/types package" "
if [ -d \"packages/types\" ]; then
  echo \"✅ @elizaos/types package exists\"
else
  echo \"❌ @elizaos/types package does not exist. Please create it first.\"
  exit 1
fi
"

# Phase 2: Verify canonical tsconfig
run_phase 2 "Verify canonical TypeScript config" "
if [ -f \"tsconfig.base.json\" ]; then
  echo \"✅ tsconfig.base.json exists\"
else
  echo \"❌ tsconfig.base.json does not exist. Please create it first.\"
  exit 1
fi
"

# Phase 3: Drop tsup, embrace tsc
run_phase 3 "Remove tsup / switch to tsc" "
for pkg_dir in \$(find packages -maxdepth 1 -type d | grep -v '^packages$'); do
  pkg_name=\$(basename \"\$pkg_dir\")
  if [ -f \"\$pkg_dir/package.json\" ]; then
    # Use alternative delimiter for sed to avoid escaping issues
    sed -i 's|\\\"build\\\":.*\\\"tsup\\\"|\\\"build\\\": \\\"tsc -p tsconfig.build.json \\&\\& node ../../scripts/postbuild-dual.js\\\"|g' \"\$pkg_dir/package.json\"
    echo \"Updated build script for \$pkg_name\"
    
    # Remove tsup config files if they exist
    find \"\$pkg_dir\" -name 'tsup.config.*' -exec rm {} \\;
  fi
done
"

# Phase 4: Externalize optional dependencies
run_phase 4 "Externalize optional native/cloud deps" "
for pkg_dir in \$(find packages -maxdepth 1 -type d | grep -v '^packages$'); do
  pkg_name=\$(basename \"\$pkg_dir\")
  if [ -f \"\$pkg_dir/package.json\" ] && grep -q '\\\"aws-sdk\\\"\\|\\\"mock-aws-s3\\\"\\|\\\"nock\\\"' \"\$pkg_dir/package.json\"; then
    echo \"Externalizing optional dependencies in \$pkg_name\"
    
    # Create optionalDependencies section if it doesn't exist
    if ! grep -q '\\\"optionalDependencies\\\"' \"\$pkg_dir/package.json\"; then
      # Use perl for in-place JSON modification
      perl -i -pe 's/(\\\"dependencies\\\":\\s*{[^}]*})/$1,\\n  \\\"optionalDependencies\\\": {\\n  }/' \"\$pkg_dir/package.json\"
    fi
    
    # Move aws-sdk, mock-aws-s3, and nock to optionalDependencies
    for dep in aws-sdk mock-aws-s3 nock; do
      if grep -q \"\\\\\"\$dep\\\\\"\" \"\$pkg_dir/package.json\"; then
        version=\$(grep -o \"\\\\\"\$dep\\\\\": \\\\\"[^\\\\\"]\+\\\\\"\" \"\$pkg_dir/package.json\" | cut -d\\\" -f4)
        # Remove from dependencies
        sed -i \"/\\\\\"\$dep\\\\\":\\s*\\\\\"[^\\\\\"]\+\\\\\"/d\" \"\$pkg_dir/package.json\"
        # Add to optionalDependencies
        perl -i -pe \"s/(\\\\\\\"optionalDependencies\\\\\\\":\\s*{)/$1\\n    \\\\\\\"\$dep\\\\\\\": \\\\\\\"\$version\\\\\\\",/\" \"\$pkg_dir/package.json\"
        echo \"  Moved \$dep to optionalDependencies in \$pkg_name\"
      fi
    done
    
    # Fix trailing commas
    sed -i 's/,\\n  }/\\n  }/' \"\$pkg_dir/package.json\"
  fi
done
"

# Phase 5: Fix import paths
run_phase 5 "Fix import paths + .js extensions" "node scripts/fix-import-extensions.js --write"

# Phase 6: Detect and refactor circular dependencies
run_phase 6 "Detect circular dependencies" "node scripts/detect-cycles.js"

# Phase 7: Update package.json exports
run_phase 7 "Uniform package.json exports" "node scripts/fix-exports.js --write" 

# Phase 8: Build packages in correct order
run_phase 8 "Build packages in dependency order" "./scripts/clean-build.sh"

# Phase 9: Verify package imports
run_phase 9 "Verify package imports" "./scripts/verify-packages.sh"

# Phase 10: Detect circular dependencies again to verify we fixed them
run_phase 10 "Final circular dependency check" "
npx madge --circular --extensions ts packages/ | tee reports/build_output/cycles-after.log && 
if grep -q 'Found [^0]' reports/build_output/cycles-after.log; then
  echo '❌ Circular dependencies still exist! See reports/build_output/cycles-after.log'
  exit 1
else
  echo '✅ No circular dependencies found!'
fi
"

# Phase 11: Cleanup and documentation
run_phase 11 "Cleanup and documentation" "
echo 'ElizaOS Build Summary' > reports/build_output/build-summary.md && 
echo '===================' >> reports/build_output/build-summary.md && 
echo '' >> reports/build_output/build-summary.md && 
echo 'Build completed at: $(date)' >> reports/build_output/build-summary.md && 
echo '' >> reports/build_output/build-summary.md && 
echo '## Generated Artifacts' >> reports/build_output/build-summary.md && 
echo '- Dependency graph: reports/build_output/dep-graph.png' >> reports/build_output/build-summary.md && 
echo '- Cycles before: reports/build_output/cycles-before.log' >> reports/build_output/build-summary.md && 
echo '- Cycles after: reports/build_output/cycles-after.log' >> reports/build_output/build-summary.md && 
echo '- Forensic report: reports/build_output/forensic-report.md' >> reports/build_output/build-summary.md && 
echo '- Build log: reports/build_output/build.log' >> reports/build_output/build-summary.md && 
echo '' >> reports/build_output/build-summary.md && 
echo 'Next steps:' >> reports/build_output/build-summary.md && 
echo '1. Tag this version: git tag v0.0.1-clean-build' >> reports/build_output/build-summary.md && 
echo '2. Push the tag: git push origin v0.0.1-clean-build' >> reports/build_output/build-summary.md && 
echo '3. Update README with new build process information' >> reports/build_output/build-summary.md && 
echo '' >> reports/build_output/build-summary.md && 
cat reports/build_output/build-summary.md
"

# Footer
echo "======================================================"
echo "ElizaOS Deterministic Build Plan Execution Complete"
echo "Finished at: $(date)"
echo "See reports/build_output/forensic-report.md for details"
echo "======================================================" 