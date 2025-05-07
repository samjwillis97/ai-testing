#!/usr/bin/env node
import { makeProgram } from './utils/program.js';
import { globalLogger, configureGlobalLogger, LogLevel } from './utils/logger.js';
import { executeQuietly } from './quiet-wrapper.js';

async function main() {
  try {
    // Configure the global logger with default settings
    configureGlobalLogger({
      level: LogLevel.INFO,
      quiet: false,
    });

    // Create the program
    const program = await makeProgram({
      initPlugins: true,
    });

    // Show help if no arguments are provided
    if (process.argv.length <= 2) {
      program.help();
    } else {
      // Check for quiet mode flag in command line arguments
      const isQuiet = process.argv.includes('-q') || process.argv.includes('--quiet');

      // Update logger configuration based on command line flags
      if (isQuiet) {
        configureGlobalLogger({
          level: LogLevel.ERROR,
          quiet: true,
        });

        // Execute in quiet mode
        executeQuietly(async () => {
          await program.parseAsync(process.argv);
        }).catch((error) => {
          globalLogger.error('Error:', error);
          process.exit(1);
        });
      } else {
        // Execute the CLI normally
        program.parseAsync(process.argv).catch((error) => {
          globalLogger.error('Error:', error);
          process.exit(1);
        });
      }
    }
  } catch (error) {
    globalLogger.error('Error initializing CLI:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  globalLogger.error('Unhandled error:', error);
  process.exit(1);
});
