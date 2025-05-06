/**
 * Collection request command
 */
import { Command, Option } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import * as fs from 'fs/promises';
import { SHCClient } from '@shc/core';
import { RequestOptions, OutputOptions } from '../types.js';
import { printResponse, printError } from '../utils/output.js';
import {
  getEffectiveOptions,
  getCollectionDir,
  createConfigManagerFromOptions,
} from '../utils/config.js';
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
    .option('-s, --silent', 'Silent mode')
    .option('--quiet', 'Quiet mode - output only the response data without any formatting or decorations')
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

        // Get collection directory
        const collectionDir = await getCollectionDir(effectiveOptions);

        // Prepare output options
        const outputOptions: OutputOptions = {
          format: (options.output as 'json' | 'yaml' | 'raw' | 'table') || 'json',
          color: options.color !== false,
          verbose: Boolean(effectiveOptions.verbose),
          silent: Boolean(effectiveOptions.silent),
          quiet: Boolean(effectiveOptions.quiet),
        };

        // Store original console methods
        const originalConsole = {
          log: console.log,
          info: console.info,
          warn: console.warn,
          error: console.error,
          debug: console.debug,
        };

        // Create no-op functions for silent/quiet mode
        const noopConsole = {
          log: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
          debug: () => {},
        };

        // If silent or quiet mode is enabled, override all console methods
        if (outputOptions.silent || outputOptions.quiet) {
          console.log = noopConsole.log;
          console.info = noopConsole.info;
          console.warn = noopConsole.warn;
          console.error = noopConsole.error;
          console.debug = noopConsole.debug;
        }

        // Create collection directory if it doesn't exist
        try {
          await fs.mkdir(collectionDir, { recursive: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            console.error(
              chalk.red(
                `Failed to create collection directory: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            process.exit(1);
          }
        }

        try {
          // Get request from collection
          const spinner = effectiveOptions.silent || outputOptions.quiet
            ? null
            : ora(`Loading request '${requestName}' from collection '${collectionName}'`).start();

          let requestOptions: RequestOptions;
          try {
            requestOptions = await getRequest(collectionDir, collectionName, requestName);
            if (spinner) {
              spinner.succeed(chalk.green(`Request loaded from collection`));
            }
          } catch (error) {
            if (spinner) {
              spinner.fail(chalk.red(`Failed to load request`));
            }
            throw error;
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

          // Execute request
          const requestSpinner = effectiveOptions.silent || outputOptions.quiet
            ? null
            : ora(
                `Sending ${requestOptions.method.toUpperCase()} request to ${requestOptions.url || `${requestOptions.path}`}`
              ).start();

          try {
            // Create client with ConfigManager and register event handlers before plugins are loaded
            const eventHandlers = outputOptions.verbose
              ? [
                  {
                    event: 'plugin:registered' as const,
                    handler: (plugin: any) => {
                      const typedPlugin = plugin as { name: string; version: string };
                      console.log(
                        chalk.blue(`Plugin registered: ${typedPlugin.name} v${typedPlugin.version}`)
                      );
                    },
                  },
                  {
                    event: 'request' as const,
                    handler: (req: any) => {
                      const typedReq = req as { method: string; url: string };
                      console.log(chalk.blue(`Request: ${typedReq.method} ${typedReq.url}`));
                    },
                  },
                  {
                    event: 'response' as const,
                    handler: (res: any) => {
                      const typedRes = res as { status: number; statusText: string };
                      console.log(
                        chalk.green(`Response: ${typedRes.status} ${typedRes.statusText}`)
                      );
                    },
                  },
                  {
                    event: 'error' as const,
                    handler: (err: any) => {
                      console.log(
                        chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)
                      );
                    },
                  },
                ]
              : [];

            const client = SHCClient.create(configManager, { eventHandlers });

            const response = await client.request(requestOptions);

            if (requestSpinner) {
              requestSpinner.succeed(chalk.green('Response received'));
            }

            printResponse(response, outputOptions);
            process.exit(0);
          } catch (error) {
            if (requestSpinner) {
              requestSpinner.fail(chalk.red('Request failed'));
            }

            printError(error, outputOptions);
            process.exit(1);
          } finally {
            // Restore original console methods
            console.log = originalConsole.log;
            console.info = originalConsole.info;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
            console.debug = originalConsole.debug;
          }
        } catch (error) {
          printError(error, outputOptions);
          process.exit(1);
        }
      }
    );
}
