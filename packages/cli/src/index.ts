#!/usr/bin/env node
import { Command } from 'commander';
import { addDirectCommand } from './commands/direct-request.js';
import { addCollectionCommand } from './commands/collection-request.js';
import { addCompletionCommand } from './commands/completion.js';
import { addListCommand } from './commands/list.js';
import { initializePlugins } from './plugins/index.js';

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
    // Initialize plugins before any command is executed
    await initializePlugins(thisCommand.opts());
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
  program.parseAsync(process.argv);
}
