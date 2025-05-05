#!/usr/bin/env node
import { makeProgram } from './utils/program.js';
import { executeSilently } from './silent-wrapper.js';

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

async function main() {
  try {
    // Create the program
    const program = await makeProgram({
      initPlugins: true,
    });

    // Show help if no arguments are provided
    if (process.argv.length <= 2) {
      program.help();
    } else {
      // Check for silent mode flag in command line arguments
      const isSilent = process.argv.includes('-s') || process.argv.includes('--silent');

      // If silent mode is enabled, execute the CLI in silent mode
      if (isSilent) {
        executeSilently(async () => {
          await program.parseAsync(process.argv);
        }).catch((error) => {
          // Restore console methods to show critical errors
          console.error = originalConsole.error;
          console.error('Critical error:', error);
          process.exit(1);
        });
      } else {
        // Execute the CLI normally
        program.parseAsync(process.argv).catch((error) => {
          console.error('Error:', error);
          process.exit(1);
        });
      }
    }
  } catch (error) {
    console.error('Error initializing CLI:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
