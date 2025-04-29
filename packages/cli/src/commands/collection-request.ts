/**
 * Collection request command
 */
import { Command, Option } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { SHCClient } from '@shc/core';
import { RequestOptions, OutputOptions } from '../types.js';
import { printResponse, printError } from '../utils/output.js';
import {
  getEffectiveOptions,
  getCollectionDir,
  createConfigManagerFromOptions,
} from '../utils/config.js';
import { getRequest, saveRequest } from '../utils/collections.js';
import path from 'path';
import * as fs from 'fs/promises';

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
    .option('--save', 'Save request to collection')
    .option('--export <path>', 'Export collection to file')
    .option('--import <path>', 'Import collection from file')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-H, --header <header...>', 'Add or override header (key:value)')
    .option('-q, --query <query...>', 'Add or override query parameter (key=value)')
    .option('-d, --data <data>', 'Override request body')
    .option('-u, --auth <auth>', 'Override authentication (format: type:credentials)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds')
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(
      async (collectionName: string, requestName: string, options: Record<string, unknown>) => {
        // Get effective options
        const effectiveOptions = await getEffectiveOptions(options);

        // Get collection directory
        const collectionDir = await getCollectionDir(effectiveOptions);

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

        // Import collection if specified
        if (options.import) {
          try {
            const importSpinner = ora(`Importing collection from ${options.import}`).start();
            const content = await fs.readFile(options.import as string, 'utf-8');
            const importPath = path.join(collectionDir, `${collectionName}.json`);
            await fs.writeFile(importPath, content, 'utf-8');
            importSpinner.succeed(chalk.green(`Collection imported to ${importPath}`));
          } catch (error) {
            console.error(
              chalk.red(
                `Failed to import collection: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            process.exit(1);
          }
        }

        // Prepare output options
        const outputOptions: OutputOptions = {
          format: (options.output as 'json' | 'yaml' | 'raw' | 'table') || 'json',
          color: options.color !== false,
          verbose: Boolean(effectiveOptions.verbose),
          silent: Boolean(effectiveOptions.silent),
        };

        try {
          // Get request from collection
          const spinner = effectiveOptions.silent
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
          const clientConfig = configManager.get('', {});

          // Execute request
          const requestSpinner = effectiveOptions.silent
            ? null
            : ora(
                `Sending ${requestOptions.method.toUpperCase()} request to ${requestOptions.url || `${requestOptions.path}`}`
              ).start();

          try {
            // Create client with configuration
            const client = SHCClient.create(clientConfig);

            // Dynamically import and register the rate-limit plugin
            try {
              const pluginPath = path.resolve(process.cwd(), 'plugins/rate-limit/dist/index.js');

              // Check if the plugin file exists
              try {
                await fs.access(pluginPath);
              } catch (error) {
                if (outputOptions.verbose) {
                  console.log(chalk.yellow(`Rate-limit plugin not found at ${pluginPath}`));
                }
                // Continue without the plugin
              }

              // Try to import the plugin
              const rateLimitPluginModule = await import(pluginPath);
              const RateLimitPlugin = rateLimitPluginModule.default;

              if (RateLimitPlugin && typeof RateLimitPlugin === 'object') {
                // Configure the plugin if possible
                if (typeof RateLimitPlugin.configure === 'function') {
                  // Extract plugin configuration from options if available
                  let pluginConfig = null;

                  if (
                    effectiveOptions.plugins &&
                    typeof effectiveOptions.plugins === 'object' &&
                    'preprocessors' in effectiveOptions.plugins &&
                    Array.isArray(effectiveOptions.plugins.preprocessors)
                  ) {
                    pluginConfig = effectiveOptions.plugins.preprocessors.find(
                      (p: Record<string, unknown>) => {
                        if ('path' in p && typeof p.path === 'string') {
                          return p.path.includes('rate-limit');
                        }
                        if ('package' in p && typeof p.package === 'string') {
                          return p.package.includes('rate-limit');
                        }
                        return false;
                      }
                    )?.config;
                  }

                  if (pluginConfig) {
                    await RateLimitPlugin.configure(pluginConfig);
                    if (outputOptions.verbose) {
                      console.log(chalk.blue('Rate-limit plugin configured with custom settings'));
                    }
                  } else {
                    // Use default configuration if none provided
                    await RateLimitPlugin.configure({
                      rules: [
                        {
                          endpoint: '.*', // Match all endpoints
                          limit: 10,
                          window: 60,
                          priority: 0,
                        },
                      ],
                      queueBehavior: 'delay',
                    });
                    if (outputOptions.verbose) {
                      console.log(chalk.blue('Rate-limit plugin configured with default settings'));
                    }
                  }
                }

                // Register the plugin with the client
                client.use(RateLimitPlugin);
                if (outputOptions.verbose) {
                  console.log(
                    chalk.blue(
                      `Plugin registered: ${RateLimitPlugin.name} v${RateLimitPlugin.version}`
                    )
                  );
                }
              }
            } catch (pluginError) {
              if (outputOptions.verbose) {
                console.log(
                  chalk.yellow(`Failed to load rate-limit plugin: ${String(pluginError)}`)
                );
              }
              // Continue without the plugin
            }

            // Register event handlers for verbose output
            if (outputOptions.verbose) {
              client.on('plugin:registered', (plugin) => {
                const typedPlugin = plugin as { name: string; version: string };
                console.log(
                  chalk.blue(`Plugin registered: ${typedPlugin.name} v${typedPlugin.version}`)
                );
              });

              client.on('request', (req) => {
                const typedReq = req as { method: string; url: string };
                console.log(chalk.blue(`Request: ${typedReq.method} ${typedReq.url}`));
              });

              client.on('response', (res) => {
                const typedRes = res as { status: number; statusText: string };
                console.log(chalk.green(`Response: ${typedRes.status} ${typedRes.statusText}`));
              });

              client.on('error', (err) => {
                console.log(
                  chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)
                );
              });
            }

            const response = await client.request(requestOptions);

            if (requestSpinner) {
              requestSpinner.succeed(chalk.green('Response received'));
            }

            printResponse(response, outputOptions);

            // Save request if specified
            if (options.save) {
              const saveSpinner = ora(`Saving request to collection`).start();
              try {
                await saveRequest(collectionDir, collectionName, requestName, requestOptions);
                saveSpinner.succeed(chalk.green(`Request saved to collection`));
              } catch (error) {
                saveSpinner.fail(chalk.red(`Failed to save request`));
                console.error(
                  chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
                );
              }
            }

            // Export collection if specified
            if (options.export) {
              const exportSpinner = ora(`Exporting collection to ${options.export}`).start();
              try {
                const collectionPath = path.join(collectionDir, `${collectionName}.json`);
                const content = await fs.readFile(collectionPath, 'utf-8');
                await fs.writeFile(options.export as string, content, 'utf-8');
                exportSpinner.succeed(chalk.green(`Collection exported to ${options.export}`));
              } catch (error) {
                exportSpinner.fail(chalk.red(`Failed to export collection`));
                console.error(
                  chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
                );
              }
            }

            process.exit(0);
          } catch (error) {
            if (requestSpinner) {
              requestSpinner.fail(chalk.red('Request failed'));
            }

            printError(error, outputOptions);
            process.exit(1);
          }
        } catch (error) {
          printError(error, outputOptions);
          process.exit(1);
        }
      }
    );
}
