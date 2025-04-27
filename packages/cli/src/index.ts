#!/usr/bin/env node
import { Command } from 'commander';
import { addDirectRequestCommand } from './commands/direct-request.js';
import { addCollectionCommand } from './commands/collection-request.js';
import { addInteractiveCommand } from './commands/interactive.js';
import { addCompletionCommand } from './commands/completion.js';

const program = new Command();

program
  .name('shc')
  .description('SHC Command Line Interface')
  .version('0.1.0')
  .option('-c, --config <path>', 'Config file path')
  .option('-e, --env <name>', 'Environment name')
  .option('-v, --verbose', 'Verbose output')
  .option('-s, --silent', 'Silent mode')
  .option('--no-color', 'Disable colors');

// Add direct request command
addDirectRequestCommand(program);

// Add collection command
addCollectionCommand(program);

// Add interactive command
addInteractiveCommand(program);

// Add completion command
addCompletionCommand(program);

program.parseAsync(process.argv);
