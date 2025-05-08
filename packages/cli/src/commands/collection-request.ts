/**
 * Collection request command
 * This command executes requests from collections
 */
import { Command, Option } from 'commander';
import chalk from 'chalk';
import { OutputOptions } from '../types.js';
import { printResponse } from '../utils/output.js';
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
    .action(async (collectionName, requestName, options) => {
      // Create a logger instance for this command
      const logger = Logger.fromCommandOptions(options);
      
      // Create a spinner for the request
      const requestSpinner = new Spinner(`Loading request '${requestName}' from collection '${collectionName}'`);
      requestSpinner.start();
      
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
        
        // Update spinner with success message
        requestSpinner.succeed(chalk.green('Response received'));
        
        // Create output options
        const outputOptions: OutputOptions = {
          format: options.output as "json" | "yaml" | "raw" | "table",
          color: Boolean(!options.noColor),
          verbose: Boolean(options.verbose),
          quiet: Boolean(options.quiet),
        };
        
        // Print the response
        printResponse(response, outputOptions);
        
      } catch (error) {
        // Update spinner with error message
        requestSpinner.fail(chalk.red('Request failed'));
        
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
