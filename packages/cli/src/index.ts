#!/usr/bin/env node
import { makeProgram } from './utils/program.js';
import { executeSilently } from './silent-wrapper.js';
import { globalLogger, configureGlobalLogger, LogLevel } from './utils/logger.js';

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
      // Check for silent mode flag in command line arguments
      const isSilent = process.argv.includes('-s') || process.argv.includes('--silent');
      const isQuiet = process.argv.includes('--quiet');

      // Update logger configuration based on command line flags
      if (isSilent) {
        configureGlobalLogger({
          level: LogLevel.SILENT,
          quiet: true,
        });
      } else if (isQuiet) {
        configureGlobalLogger({
          level: LogLevel.INFO,
          quiet: true,
        });
      }

      // If silent mode is enabled, execute the CLI in silent mode
      if (isSilent) {
        executeSilently(async () => {
          await program.parseAsync(process.argv);
        }).catch((error) => {
          // Log critical errors even in silent mode
          globalLogger.error('Critical error:', error);
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
