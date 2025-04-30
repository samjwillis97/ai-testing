#!/usr/bin/env bash

# Test script for CLI silent mode
# This script tests various combinations of silent mode and output formats

# Get the absolute path to the CLI executable
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_PATH="$SCRIPT_DIR/../dist/index.js"

echo "Building packages..."
cd "$(dirname "$0")/../.." && pnpm run build

echo -e "\n=== Testing silent mode with raw output ==="
echo "Command: node $CLI_PATH get https://httpbin.org/json -s -o raw"
OUTPUT=$(node "$CLI_PATH" get https://httpbin.org/json -s -o raw)
# Check if the output contains only valid JSON
if echo "$OUTPUT" | grep -q "Registered" || echo "$OUTPUT" | grep -q "initialized"; then
  echo "❌ FAIL: Silent mode is not working correctly. Found initialization messages."
  echo "Output:"
  echo "$OUTPUT"
else
  echo "✅ PASS: Silent mode is working correctly."
  # Verify the output is valid JSON
  if echo "$OUTPUT" | jq . > /dev/null 2>&1; then
    echo "✅ PASS: Output is valid JSON."
  else
    echo "❌ FAIL: Output is not valid JSON."
  fi
fi

echo -e "\n=== Testing silent mode with JSON output ==="
echo "Command: node $CLI_PATH get https://httpbin.org/json -s -o json"
OUTPUT=$(node "$CLI_PATH" get https://httpbin.org/json -s -o json)
# Check if the output contains only valid JSON
if echo "$OUTPUT" | grep -q "Registered" || echo "$OUTPUT" | grep -q "initialized"; then
  echo "❌ FAIL: Silent mode is not working correctly. Found initialization messages."
else
  echo "✅ PASS: Silent mode is working correctly."
  # Verify the output is valid JSON
  if echo "$OUTPUT" | jq . > /dev/null 2>&1; then
    echo "✅ PASS: Output is valid JSON."
  else
    echo "❌ FAIL: Output is not valid JSON."
  fi
fi

echo -e "\n=== Testing non-silent mode for comparison ==="
echo "Command: node $CLI_PATH get https://httpbin.org/json -o raw"
OUTPUT=$(node "$CLI_PATH" get https://httpbin.org/json -o raw)
if echo "$OUTPUT" | grep -q "Registered" || echo "$OUTPUT" | grep -q "initialized"; then
  echo "✅ PASS: Non-silent mode shows initialization messages as expected."
else
  echo "❌ FAIL: Non-silent mode should show initialization messages."
fi

echo -e "\n=== Testing complete ==="
