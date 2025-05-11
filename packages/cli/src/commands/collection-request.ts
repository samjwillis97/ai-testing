/**
 * Collection request command
 * This command executes requests from collections
 */
import { Command, Option } from 'commander';
import { CommandWithLogger } from '../utils/program.js';
import chalk from 'chalk';
import { OutputOptions } from '../types.js';
import { printResponse, formatOutput } from '../utils/output.js';
import { getCollectionDir } from '../utils/config.js';
import { Logger } from '../utils/logger.js';
import { Spinner } from '../utils/spinner.js';
import { executeRequest } from '../utils/collections.js';

/**
 * Add collection request command to program
 */
export function addCollectionCommand(program: Command): void {
  program
    .command('collection')
    .alias('c')
    .description('Execute a request from a collection')
    .argument('<collection>', 'Collection name')
    .argument('<request>', 'Request name')
    .option('-c, --config <PATH>', 'Config file path')
    .option('--collection-dir <dir>', 'Collection directory')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-v, --verbose', 'Verbose output')
    .option('-q, --quiet', 'Quiet output')
    .option('--no-color', 'Disable colored output')
    .option('--silent', 'Silent mode - no output except errors')
    .option('-H, --header <header...>', 'Add header (can be used multiple times)')
    .option('-Q, --query <query...>', 'Add query parameter (can be used multiple times)')
    .option('-B, --body <body>', 'Request body')
    .option('--body-file <file>', 'Read body from file')
    .option('--var-set <varset...>', 'Variable set overrides in format namespace=value')
    .option('--timeout <ms>', 'Request timeout in milliseconds')
    .option('--auth <type>', 'Authentication type')
    .option('--auth-token <token>', 'Authentication token')
    .option('--auth-user <user>', 'Authentication username')
    .option('--auth-pass <pass>', 'Authentication password')
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(async function(this: Command, collectionName, requestName, options) {
      // Use the global logger instance from the program if available
      const parentWithLogger = this.parent as CommandWithLogger;
      const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);
      
      // Check if we're in quiet mode using the logger
      const isQuietMode = logger.isQuietMode();
      
      // Only create and use a spinner if not in quiet mode
      let requestSpinner = null;
      
      if (!isQuietMode) {
        requestSpinner = new Spinner(`Starting request`, {
          enabled: true,
          logger,
          color: 'cyan'
        });
        requestSpinner.start();
      }
      
      try {
        // Get the collection directory
        const collectionDir = await getCollectionDir(options);
        
        // Execute the request using the collections utility
        const response = await executeRequest(
          collectionDir,
          collectionName,
          requestName,
          {
            // Apply any additional options
            ...options,
          },
          logger
        );
        
        // Show success message only if not in quiet mode
        if (requestSpinner) {
          requestSpinner.succeed(chalk.green('Response received'));
        }
        
        // In quiet mode, directly output the raw data without any formatting or status information
        if (isQuietMode) {
          // Just output the raw JSON data directly to stdout (not console.log)
          process.stdout.write(JSON.stringify(response.data, null, 2) + '\n');
        } else {
          // For normal mode, use the standard output formatting
          const outputOptions: OutputOptions = {
            format: options.output as "json" | "yaml" | "raw" | "table",
            color: Boolean(!options.noColor),
            verbose: Boolean(options.verbose),
            quiet: false, // Ensure quiet is false here
          };
          
          // Print the response with formatting
          printResponse(response, outputOptions);
        }
        
      } catch (error) {
        // Update spinner with error message only if not in quiet mode
        if (requestSpinner) {
          requestSpinner.fail(chalk.red(`Request failed: ${error instanceof Error ? error.message : String(error)}`));
        }
        logger.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
        );
        if (error instanceof Error && error.stack) {
          logger.debug(chalk.gray(error.stack));
        }
        process.exit(1);
      }
    });
}
