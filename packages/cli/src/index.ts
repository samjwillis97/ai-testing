#!/usr/bin/env node
import { Command } from 'commander';
import { addDirectCommand } from './commands/direct-request.js';
import { addCollectionCommand } from './commands/collection-request.js';
import { addCompletionCommand } from './commands/completion.js';
import { addListCommand } from './commands/list.js';
import { initializePlugins } from './plugins/index.js';
import { executeSilently } from './silent-wrapper.js';

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

const program = new Command();

program
  .name('shc')
  .description('SHC Command Line Interface')
  .version('0.1.0')
  .option('-c, --config <PATH>', 'Config file path')
  .option('-e, --env <NAME>', 'Environment name')
  .option('-v, --verbose', 'Verbose output')
  .option('-s, --silent', 'Silent mode')
  .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
  .option('--no-color', 'Disable colors')
  .hook('preAction', async (thisCommand) => {
    // Get options
    const options = thisCommand.opts();
    const isSilent = Boolean(options.silent);

    // If silent mode is enabled, execute initialization in silent mode
    if (isSilent) {
      await executeSilently(async () => {
        await initializePlugins(options);
      });
    } else {
      // Initialize plugins normally
      await initializePlugins(options);
    }
  });

// Enable passing global options to subcommands
program.passThroughOptions();

// Add direct request command
addDirectCommand(program);

// Add collection command
addCollectionCommand(program);

// Add list command
addListCommand(program);

// Add completion command
addCompletionCommand(program);

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
