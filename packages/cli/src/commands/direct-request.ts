/**
 * Direct request command
 */
import { Command, Option } from 'commander';
import { CommandWithLogger } from '../utils/program.js';
import chalk from 'chalk';
import { SHCClient, SHCEvent } from '@shc/core';
import { RequestOptions, OutputOptions, HttpMethod } from '../types.js';
import { printResponse, formatOutput } from '../utils/output.js';
import { getEffectiveOptions, createConfigManagerFromOptions } from '../utils/config.js';
import { Logger, LogLevel } from '../utils/logger.js';
import { Spinner } from '../utils/spinner.js';

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

    .option(
      '--quiet',
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
    .action(async function(this: Command, method: string, url: string, options: Record<string, unknown>) {
      // Use the global logger instance from the program if available
      const parentWithLogger = this.parent as CommandWithLogger;
      const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);
      await executeDirectRequest(method as HttpMethod, url, options, logger);
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

    .option(
      '--quiet',
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
    .addOption(new Option('--no-color', 'Disable colors'));

  // Add body option for methods that support it
  if (hasBody) {
    cmd.option('-d, --data <data>', 'Request body');
  }

  cmd.action(async function(this: Command, url: string, options: Record<string, unknown>) {
    // Use the global logger instance from the program if available
    const parentWithLogger = this.parent as CommandWithLogger;
    const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);
    await executeDirectRequest(method.toUpperCase() as HttpMethod, url, options, logger);
  });
}

/**
 * Execute a direct HTTP request
 */
async function executeDirectRequest(
  method: HttpMethod,
  url: string,
  options: Record<string, unknown>,
  logger?: Logger
): Promise<void> {
  // Use provided logger or create one from command options
  logger = logger || Logger.fromCommandOptions(options);

  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Console methods are preserved for reference

  // Get effective options
  const effectiveOptions = await getEffectiveOptions(options);

  // Prepare output options
  const outputOptions: OutputOptions = {
    format: (options.output as OutputOptions['format']) || 'json',
    color: options.color !== false,
    verbose: options.verbose as boolean,
    quiet: options.quiet as boolean,
  };

  try {
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

    // Check if we're in quiet mode
    const isQuietMode = logger.isQuietMode();
    
    // Only create a spinner if not in quiet mode
    let spinner = null;
    if (!isQuietMode) {
      spinner = new Spinner(`Sending ${method} request to ${url}`, {
        enabled: true,
        logger,
        color: 'cyan'
      });
      spinner.start();
    }

    try {

      // Create client configuration
      const configManager = await createConfigManagerFromOptions(effectiveOptions);

      // Register event handlers for debugging
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

      // Execute request
      const response = await client.request(requestOptions);

      // Update spinner with success message if it exists
      if (spinner) {
        spinner.succeed(chalk.green('Response received'));
      }

      // In quiet mode, only output the raw data without any formatting or status information
      if (isQuietMode) {
        // Format the data according to the specified format
        const formattedData = formatOutput(response.data, outputOptions);
        // Write directly to stdout without any status information
        process.stdout.write(formattedData + '\n');
      } else {
        // Print the response with full formatting
        await printResponse(response, outputOptions);
      }
      process.exit(0);
    } catch (error) {
      // Update spinner with error message if it exists
      if (spinner) {
        spinner.fail(chalk.red('Request failed'));
      }

      logger.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      if (error instanceof Error && error.stack) {
        logger.error(chalk.gray(error.stack));
      }
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
