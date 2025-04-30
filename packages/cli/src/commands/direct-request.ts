/**
 * Direct request command
 */
import { Command, Option } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { SHCClient } from '@shc/core';
import { RequestOptions, OutputOptions, HttpMethod } from '../types.js';
import { printResponse, printError } from '../utils/output.js';
import { getEffectiveOptions, createConfigManagerFromOptions } from '../utils/config.js';
import path from 'path';
import fs from 'fs/promises';

// We'll dynamically import the rate-limit plugin at runtime
// instead of statically importing it to avoid TypeScript errors

/**
 * Add direct request command to program
 */
export function addDirectCommand(program: Command): void {
  // Add individual HTTP method commands
  addHttpMethodCommand(program, 'get', 'Execute a GET request');
  addHttpMethodCommand(program, 'post', 'Execute a POST request', true);
  addHttpMethodCommand(program, 'put', 'Execute a PUT request', true);
  addHttpMethodCommand(program, 'patch', 'Execute a PATCH request', true);
  addHttpMethodCommand(program, 'delete', 'Execute a DELETE request');
  addHttpMethodCommand(program, 'head', 'Execute a HEAD request');
  addHttpMethodCommand(program, 'options', 'Execute an OPTIONS request');

  // Add generic direct command
  program
    .command('direct <method> <url>')
    .description('Execute an HTTP request with the specified method')
    .option('-c, --config <PATH>', 'Config file path')
    .option('-H, --header <header...>', 'Add header (key:value)')
    .option('-q, --query <query...>', 'Add query parameter (key=value)')
    .option('-d, --data <data>', 'Request body')
    .option('-u, --auth <auth>', 'Authentication (format: type:credentials)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-v, --verbose', 'Verbose output')
    .option('-s, --silent', 'Silent mode')
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(async (method: string, url: string, options: Record<string, unknown>) => {
      await executeDirectRequest(method as HttpMethod, url, options);
    });
}

/**
 * Add an HTTP method-specific command
 */
function addHttpMethodCommand(
  program: Command,
  method: string,
  description: string,
  hasBody = false
): void {
  const cmd = program
    .command(`${method} <url>`)
    .description(description)
    .option('-c, --config <PATH>', 'Config file path')
    .option('-H, --header <header...>', 'Add header (key:value)')
    .option('-q, --query <query...>', 'Add query parameter (key=value)')
    .option('-u, --auth <auth>', 'Authentication (format: type:credentials)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-v, --verbose', 'Verbose output')
    .option('-s, --silent', 'Silent mode')
    .addOption(new Option('--no-color', 'Disable colors'));

  // Add data option for methods that can have a request body
  if (hasBody) {
    cmd.option('-d, --data <data>', 'Request body');
  }

  cmd.action(async (url: string, options: Record<string, unknown>) => {
    await executeDirectRequest(method.toUpperCase() as HttpMethod, url, options);
  });
}

/**
 * Execute a direct HTTP request
 */
async function executeDirectRequest(
  method: HttpMethod,
  url: string,
  options: Record<string, unknown>
): Promise<void> {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Create no-op functions for silent mode
  const noopConsole = {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  // Get effective options
  const effectiveOptions = await getEffectiveOptions(options);
  const isSilent = Boolean(effectiveOptions.silent);

  // If silent mode is enabled, override all console methods
  if (isSilent) {
    console.log = noopConsole.log;
    console.info = noopConsole.info;
    console.warn = noopConsole.warn;
    console.error = noopConsole.error;
    console.debug = noopConsole.debug;
  }

  try {
    // Prepare output options
    const outputOptions: OutputOptions = {
      format: (options.output as 'json' | 'yaml' | 'raw' | 'table') || 'json',
      color: options.color !== false,
      verbose: Boolean(effectiveOptions.verbose),
      silent: isSilent,
    };

    // Prepare request options
    const requestOptions: RequestOptions = {
      method,
      url,
      headers: {},
      params: {},
    };

    // Add headers if specified
    if (options.header && Array.isArray(options.header)) {
      for (const header of options.header) {
        const [key, ...valueParts] = (header as string).split(':');
        const value = valueParts.join(':').trim();
        if (key && value) {
          requestOptions.headers![key.trim()] = value;
        }
      }
    }

    // Add query parameters if specified
    if (options.query && Array.isArray(options.query)) {
      for (const query of options.query) {
        const [key, ...valueParts] = (query as string).split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          requestOptions.params![key.trim()] = value;
        }
      }
    }

    // Add request body if specified
    if (options.data) {
      try {
        // Try to parse as JSON
        requestOptions.data = JSON.parse(options.data as string);
      } catch {
        // Use as raw string if not valid JSON
        requestOptions.data = options.data;
      }
    }

    // Add authentication if specified
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

    // Add timeout if specified
    if (options.timeout) {
      requestOptions.timeout = parseInt(options.timeout as string, 10);
    }

    // Create client configuration
    const configManager = await createConfigManagerFromOptions(effectiveOptions);
    const clientConfig = configManager.get('', {});

    // Only create a spinner if not in silent mode
    const spinner = isSilent ? null : ora(`Sending ${method} request to ${url}`).start();

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
          // Only log if verbose and not silent
          if (outputOptions.verbose && !isSilent) {
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
              // Only log if verbose and not silent
              if (outputOptions.verbose && !isSilent) {
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
              // Only log if verbose and not silent
              if (outputOptions.verbose && !isSilent) {
                console.log(chalk.blue('Rate-limit plugin configured with default settings'));
              }
            }
          }

          // Register the plugin with the client
          client.use(RateLimitPlugin);
          // Only log if verbose and not silent
          if (outputOptions.verbose && !isSilent) {
            console.log(
              chalk.blue(`Plugin registered: ${RateLimitPlugin.name} v${RateLimitPlugin.version}`)
            );
          }
        }
      } catch (pluginError) {
        // Only log if verbose and not silent
        if (outputOptions.verbose && !isSilent) {
          console.log(chalk.yellow(`Failed to load rate-limit plugin: ${String(pluginError)}`));
        }
        // Continue without the plugin
      }

      // Register event handlers for verbose output, but only if not silent
      if (outputOptions.verbose && !isSilent) {
        client.on('plugin:registered', (plugin) => {
          const typedPlugin = plugin as { name: string; version: string };
          console.log(chalk.blue(`Plugin registered: ${typedPlugin.name} v${typedPlugin.version}`));
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
          console.log(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`));
        });
      }

      const response = await client.request(requestOptions);

      if (spinner) {
        spinner.succeed(chalk.green('Response received'));
      }

      // In silent mode with raw format, just output the raw data directly
      if (isSilent && outputOptions.format === 'raw') {
        const formatter = (data: unknown) => {
          if (typeof data === 'string') {
            return data;
          }
          if (Buffer.isBuffer(data)) {
            return data.toString('utf-8');
          }
          if (typeof data === 'object' && data !== null) {
            try {
              return JSON.stringify(data, null, 2);
            } catch (e) {
              return String(data);
            }
          }
          return String(data);
        };

        // Output directly to stdout without any decoration
        process.stdout.write(formatter(response.data));
      } else {
        printResponse(response, outputOptions);
      }

      process.exit(0);
    } catch (error) {
      if (spinner) {
        spinner.fail(chalk.red('Request failed'));
      }

      printError(error, outputOptions);
      process.exit(1);
    }
  } finally {
    // Always restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }
}
