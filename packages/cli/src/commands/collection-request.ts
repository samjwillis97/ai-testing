/**
 * Collection request command
 */
import { Command, Option } from 'commander';
import chalk from 'chalk';
import { SHCClient, SHCEvent } from '@shc/core';
import { OutputOptions, RequestOptions } from '../types.js';
import { printResponse } from '../utils/output.js';
import {
  getEffectiveOptions,
  createConfigManagerFromOptions,
  getCollectionDir,
} from '../utils/config.js';
import fs from 'fs/promises';
import { Logger, LogLevel } from '../utils/logger.js';
import { Spinner } from '../utils/spinner.js';
import { getRequest } from '../utils/collections.js';

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
    .option('-H, --header <header...>', 'Add or override header (key:value)')
    .option('-q, --query <query...>', 'Add or override query parameter (key=value)')
    .option('-d, --data <data>', 'Override request body')
    .option('-u, --auth <auth>', 'Override authentication (format: type:credentials)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds')
    .option('-v, --verbose', 'Enable verbose output')
    .option(
      '-q, --quiet',
      'Quiet mode - output only the response data without any formatting or decorations'
    )
    .option(
      '--var-set <namespace>=<value>',
      'Override variable set for this request (i.e. --var-set api=production)',
      (value: string, previous: string[]) => {
        // Allow multiple --var-set options
        const values = previous || [];
        values.push(value);
        return values;
      },
      []
    )
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(
      async (collectionName: string, requestName: string, options: Record<string, unknown>) => {
        // Get effective options
        const effectiveOptions = await getEffectiveOptions(options);
        const logger = Logger.fromCommandOptions(effectiveOptions);

        // Prepare output options
        const outputOptions: OutputOptions = {
          format: (options.output as OutputOptions['format']) || 'json',
          color: options.color !== false,
          verbose: options.verbose as boolean,
          quiet: options.quiet as boolean,
        };

        // Create collection directory if it doesn't exist
        try {
          const collectionDir = await getCollectionDir(effectiveOptions);
          await fs.mkdir(collectionDir, { recursive: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            logger.error(
              chalk.red(
                `Failed to create collection directory: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            process.exit(1);
          }
        }

        try {
          // Create spinner for loading the request
          const spinner = Spinner.fromCommandOptions(
            `Loading request '${requestName}' from collection '${collectionName}'`,
            options
          );

          let requestOptions: RequestOptions;
          try {
            // Start the spinner
            spinner.start();

            const collectionDir = await getCollectionDir(effectiveOptions);
            requestOptions = await getRequest(collectionDir, collectionName, requestName);

            // Stop the spinner with success message
            spinner.succeed(`Request '${requestName}' loaded successfully`);
          } catch (error) {
            // Stop the spinner with error message
            spinner.fail(
              chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
            );
            process.exit(1);
          }

          // Override request options with CLI options

          // Override headers
          if (options.header && Array.isArray(options.header)) {
            requestOptions.headers = requestOptions.headers || {};
            for (const header of options.header) {
              const [key, ...valueParts] = (header as string).split(':');
              const value = valueParts.join(':').trim();
              if (key && value) {
                requestOptions.headers[key.trim()] = value;
              }
            }
          }

          // Override query parameters
          if (options.query && Array.isArray(options.query)) {
            requestOptions.params = requestOptions.params || {};
            for (const query of options.query) {
              const [key, ...valueParts] = (query as string).split('=');
              const value = valueParts.join('=').trim();
              if (key && value) {
                requestOptions.params[key.trim()] = value;
              }
            }
          }

          // Override request body
          if (options.data) {
            try {
              // Try to parse as JSON
              requestOptions.data = JSON.parse(options.data as string);
            } catch {
              // Use as raw string if not valid JSON
              requestOptions.data = options.data;
            }
          }

          // Override authentication
          if (options.auth) {
            const [type, ...credentialParts] = (options.auth as string).split(':');
            const credentials = credentialParts.join(':').trim();
            if (type && credentials) {
              requestOptions.auth = {
                type: type.trim(),
                credentials,
              };
            }
          }

          // Override timeout if specified
          if (options.timeout) {
            requestOptions.timeout = parseInt(options.timeout as string, 10);
          }

          // Create client configuration
          const configManager = await createConfigManagerFromOptions(effectiveOptions);

          // Create spinner for sending the request
          const requestSpinner = Spinner.fromCommandOptions(
            `Sending ${requestOptions.method.toUpperCase()} request to ${requestOptions.url || `${requestOptions.path}`}`,
            options
          );

          try {
            // Start the spinner
            requestSpinner.start();

            // Create client with ConfigManager and register event handlers before plugins are loaded
            const eventHandlers: { event: SHCEvent; handler: (event: unknown) => void }[] =
              logger.level === 'debug'
                ? [
                    {
                      event: 'request',
                      handler: (req: unknown) => {
                        logger.debug('Request:', JSON.stringify(req, null, 2));
                      },
                    },
                    {
                      event: 'response',
                      handler: (res: unknown) => {
                        logger.debug('Response:', JSON.stringify(res, null, 2));
                      },
                    },
                    {
                      event: 'error',
                      handler: (err: unknown) => {
                        logger.error(
                          chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)
                        );
                      },
                    },
                  ]
                : [];

            const client = SHCClient.create(configManager, { eventHandlers });

            const response = await client.request(requestOptions);

            // Update spinner with success message
            requestSpinner.succeed(chalk.green('Response received'));

            printResponse(response, outputOptions);
            process.exit(0);
          } catch (error) {
            // Update spinner with error message
            requestSpinner.fail(chalk.red('Request failed'));

            logger.error(
              chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
            );
            if (
              error instanceof Error &&
              error.stack
            ) {
              logger.error(chalk.gray(error.stack));
            }
            process.exit(1);
          }
        } catch (error) {
          logger.error(
            chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
          );
          if (error instanceof Error && error.stack) {
            logger.error(chalk.gray(error.stack));
          }
          process.exit(1);
        }
      }
    );
}
