#!/bin/bash

echo "Validating exports block format..."

# Validate exports format
for PKG in packages/*/; do
  PKGNAME=$(basename $PKG)
  if [[ "$PKGNAME" != "characters" && "$PKGNAME" != "plugin-multiagent-coordinator" ]]; then
    if [ -f "$PKG/package.json" ]; then
      echo "Checking exports for $PKG..."
      if ! jq .exports $PKG/package.json > /dev/null 2>&1; then
        echo "🚨 Malformed exports in $PKG/package.json"
      else
        echo "✅ Valid exports in $PKG/package.json"
      fi
    fi
  fi
done

# Check nested client packages
for CLIENT_PKG in packages/clients/*/; do
  if [ -f "$CLIENT_PKG/package.json" ]; then
    CLIENT_NAME=$(basename $CLIENT_PKG)
    echo "Checking exports for clients/$CLIENT_NAME..."
    if ! jq .exports $CLIENT_PKG/package.json > /dev/null 2>&1; then
      echo "🚨 Malformed exports in $CLIENT_PKG/package.json"
    else
      echo "✅ Valid exports in $CLIENT_PKG/package.json"
    fi
  fi
done

echo "✅ Exports validation complete" 