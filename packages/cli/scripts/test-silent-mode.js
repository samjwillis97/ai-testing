#!/usr/bin/env node
/**
 * Test script for CLI silent mode
 * This script directly tests the silent mode functionality by executing commands with and without the silent flag
 */

// Capture stdout to test output
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

// Create buffers to store output
let stdoutOutput = '';
let stderrOutput = '';

// Override stdout.write to capture output
process.stdout.write = (chunk) => {
  stdoutOutput += chunk;
  return true;
};

// Override stderr.write to capture output
process.stderr.write = (chunk) => {
  stderrOutput += chunk;
  return true;
};

// Import the CLI modules directly
import { formatOutput, formatResponse, printResponse } from '../dist/utils/output.js';

// Test data
const testData = {
  simple: 'Hello World',
  object: { name: 'Test', value: 123 },
  array: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ],
};

// Test response
const testResponse = {
  status: 200,
  statusText: 'OK',
  headers: {
    'content-type': 'application/json',
    'content-length': '123',
  },
  data: testData.object,
};

// Test output options
const outputOptions = {
  format: 'raw',
  color: true,
  verbose: false,
  silent: false,
};

// Test silent mode with raw format
console.log('\n=== Testing silent mode with raw format ===');
stdoutOutput = '';
stderrOutput = '';

// Set silent mode and raw format
const silentRawOptions = { ...outputOptions, silent: true, format: 'raw' };

// Test formatOutput
const silentRawOutput = formatOutput(testData.object, silentRawOptions);
console.log('formatOutput result:', silentRawOutput ? 'Output received' : 'No output');

// Test formatResponse
const silentRawResponseOutput = formatResponse(testResponse, silentRawOptions);
console.log('formatResponse result:', silentRawResponseOutput ? 'Output received' : 'No output');

// Test printResponse
stdoutOutput = '';
printResponse(testResponse, silentRawOptions);
console.log('printResponse result:', stdoutOutput ? 'Output received' : 'No output');
console.log('Output content:', stdoutOutput);

// Test non-silent mode for comparison
console.log('\n=== Testing non-silent mode with raw format ===');
stdoutOutput = '';
stderrOutput = '';

// Set non-silent mode and raw format
const nonSilentRawOptions = { ...outputOptions, silent: false, format: 'raw' };

// Test printResponse
printResponse(testResponse, nonSilentRawOptions);
console.log('printResponse result:', stdoutOutput ? 'Output received' : 'No output');

// Restore original stdout and stderr
process.stdout.write = originalStdoutWrite;
process.stderr.write = originalStderrWrite;

console.log('\n=== Testing complete ===');
