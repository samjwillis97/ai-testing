#!/usr/bin/env node

// Simple script to test quiet mode
console.log('This is a test of quiet mode');

// Check if --quiet flag is present
const isQuiet = process.argv.includes('--quiet') || process.argv.includes('-q');
console.log(`Quiet mode is ${isQuiet ? 'enabled' : 'disabled'}`);

// In quiet mode, only output the raw data
if (isQuiet) {
  // This should be the only output in quiet mode
  console.log(JSON.stringify({ data: 'This is the raw data output' }, null, 2));
} else {
  console.log('This is normal mode output with formatting');
  console.log(JSON.stringify({ data: 'This is the raw data output' }, null, 2));
}
