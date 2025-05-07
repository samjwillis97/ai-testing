#!/usr/bin/env node
import { makeProgram } from './utils/program.js';
import { Logger } from './utils/logger.js';

async function main() {
  try {
    // Set default NODE_ENV if not already set
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';

    // Check for quiet mode flag in command line arguments first
    // so we can configure the logger properly from the start
    const isQuiet = process.argv.includes('-q') || process.argv.includes('--quiet');
    const isVerbose = process.argv.includes('-v') || process.argv.includes('--verbose');

    // Configure the global logger with settings based on command line flags
    // This should only happen once at the beginning of execution
    const logger = Logger.getInstance({
      quiet: isQuiet,
      verbose: isVerbose,
    });

    // Log the environment mode
    const isProduction = process.env.NODE_ENV === 'production';
    logger.debug(`Running in ${isProduction ? 'production' : 'development'} mode`);

    // Create the program with the same logger settings
    const program = await makeProgram({
      initPlugins: true,
    });

    // Show help if no arguments are provided
    if (process.argv.length <= 2) {
      program.help();
    } else {
      // Execute the CLI normally
      program.parseAsync(process.argv).catch((error) => {
        logger.error('Error:', error);
        process.exit(1);
      });
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
