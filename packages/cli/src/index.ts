#!/usr/bin/env node
import { makeProgram } from './utils/program.js';
import { globalLogger, configureGlobalLogger, LogLevel } from './utils/logger.js';
import { executeQuietly } from './quiet-wrapper.js';

async function main() {
  try {
    // Set default NODE_ENV if not already set
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    // Check for quiet mode flag in command line arguments first
    // so we can configure the logger properly from the start
    const isQuiet = process.argv.includes('-q') || process.argv.includes('--quiet');
    const isVerbose = process.argv.includes('-v') || process.argv.includes('--verbose');

    // Configure the global logger with settings based on command line flags
    configureGlobalLogger({
      level: isVerbose ? LogLevel.DEBUG : isQuiet ? LogLevel.ERROR : LogLevel.INFO,
      quiet: isQuiet,
      verbose: isVerbose,
    });

    // Log the environment mode
    const isProduction = process.env.NODE_ENV === 'production';
    globalLogger.debug(`Running in ${isProduction ? 'production' : 'development'} mode`);

    // Create the program with the same logger settings
    const program = await makeProgram({
      initPlugins: true,
    });

    // Show help if no arguments are provided
    if (process.argv.length <= 2) {
      program.help();
    } else if (isQuiet) {
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
