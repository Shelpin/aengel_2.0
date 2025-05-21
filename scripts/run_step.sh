#!/usr/bin/env bash
set -euo pipefail

# Helper script for deterministic build plan commands
# Provides unified logging and tracking for build steps
# 
# Usage: ./scripts/run_step.sh <phase_number> <description> <command>
# Example: ./scripts/run_step.sh 5 "Fixing import paths" "node scripts/fix-import-extensions.js --write"

PHASE="${1:-0}"; DESC="${2:-Unknown}"; shift 2 || true; CMD="${*:-echo 'No command specified'}"
LOG_DIR="reports/build_output"; mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/build.log"
SESSION_ID=$(date +"%Y%m%d_%H%M%S")
START=$(date +%s)

# Add phase marker to log and console
echo -e "\n=== PHASE ${PHASE}: ${DESC} ===\n"
{
  echo "[ $(date '+%F %T') | Session: $SESSION_ID ] PHASE ${PHASE}: ${DESC}";
  echo "CMD: ${CMD}";
  
  # Execute the command and capture output and exit code
  OUTPUT=$(eval "${CMD}" 2>&1) || {
    EXIT_CODE=$?
    echo "$OUTPUT"
    echo "EXIT ${EXIT_CODE}";
    echo "Duration $(( $(date +%s) - START ))s";
    echo "!!! FAILURE";
    echo "$OUTPUT" >> "$LOG_DIR/phase-${PHASE}.log"
    exit $EXIT_CODE
  }
  
  # If we get here, command was successful
  echo "$OUTPUT"
  echo "EXIT 0";
  echo "Duration $(( $(date +%s) - START ))s";
  echo "✅ SUCCESS";
  
  # Save phase-specific log
  echo "[ $(date '+%F %T') | Session: $SESSION_ID ] PHASE ${PHASE}: ${DESC}" > "$LOG_DIR/phase-${PHASE}.log"
  echo "CMD: ${CMD}" >> "$LOG_DIR/phase-${PHASE}.log"
  echo "$OUTPUT" >> "$LOG_DIR/phase-${PHASE}.log"
  echo "Duration $(( $(date +%s) - START ))s" >> "$LOG_DIR/phase-${PHASE}.log"
  
  # Update forensic report
  REPORT_FILE="$LOG_DIR/forensic-report.md"
  if [ ! -f "$REPORT_FILE" ]; then
    echo "# Build Report - [$(date '+%F %T')]" > "$REPORT_FILE"
  fi
  
  {
    echo -e "\n## Phase ${PHASE}: ${DESC}"
    echo "- Start: $(date -d@$START '+%F %T')"
    echo "- End: $(date '+%F %T')"
    echo "- Duration: $(( $(date +%s) - START ))s"
    echo "- Status: ✅"
    echo "- Commands Run:"
    echo "  1. \`${CMD}\` – exit:0"
    echo "- Artefacts: phase-${PHASE}.log"
  } >> "$REPORT_FILE"
} | tee -a "$LOG_FILE" 