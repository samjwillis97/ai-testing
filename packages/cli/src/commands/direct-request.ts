/**
 * Direct request command
 */
import { Command, Option } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { SHCClient } from '@shc/core';
import { RequestOptions, OutputOptions, HttpMethod } from '../types.js';
import { printResponse, printError } from '../utils/output.js';
import { getEffectiveOptions } from '../utils/config.js';

/**
 * Add direct request command to program
 */
export function addDirectRequestCommand(program: Command): void {
  program
    .argument('<method>', 'HTTP method (get, post, put, delete, etc)')
    .argument('<url>', 'Request URL')
    .option('-H, --header <header...>', 'Add header (key:value)')
    .option('-d, --data <data>', 'Request body')
    .option('-q, --query <query...>', 'Query parameter (key=value)')
    .option('-u, --auth <auth>', 'Authentication (format: type:credentials)')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds')
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(async (method: string, url: string, options: Record<string, unknown>) => {
      // Get effective options
      const effectiveOptions = await getEffectiveOptions(options);

      // Prepare request options
      const requestOptions: RequestOptions = {
        method: method.toUpperCase() as HttpMethod,
        url,
      };

      // Parse headers
      if (options.header && Array.isArray(options.header)) {
        requestOptions.headers = {};
        for (const header of options.header) {
          const [key, ...valueParts] = (header as string).split(':');
          const value = valueParts.join(':').trim();
          if (key && value) {
            requestOptions.headers[key.trim()] = value;
          }
        }
      }

      // Parse query parameters
      if (options.query && Array.isArray(options.query)) {
        requestOptions.params = {};
        for (const query of options.query) {
          const [key, ...valueParts] = (query as string).split('=');
          const value = valueParts.join('=').trim();
          if (key && value) {
            requestOptions.params[key.trim()] = value;
          }
        }
      }

      // Add request body
      if (options.data) {
        try {
          // Try to parse as JSON
          requestOptions.data = JSON.parse(options.data as string);
        } catch {
          // Use as raw string if not valid JSON
          requestOptions.data = options.data;
        }
      }

      // Parse authentication
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

      // Prepare output options
      const outputOptions: OutputOptions = {
        format: (options.output as 'json' | 'yaml' | 'raw' | 'table') || 'json',
        color: options.color !== false,
        verbose: Boolean(effectiveOptions.verbose),
        silent: Boolean(effectiveOptions.silent),
      };

      // Execute request
      const spinner = effectiveOptions.silent
        ? null
        : ora(`Sending ${method.toUpperCase()} request to ${url}`).start();
      try {
        const client = SHCClient.create();
        const response = await client.request(requestOptions);

        if (spinner) {
          spinner.succeed(chalk.green('Response received'));
        }

        printResponse(response, outputOptions);
        process.exit(0);
      } catch (error) {
        if (spinner) {
          spinner.fail(chalk.red('Request failed'));
        }

        printError(error, outputOptions);
        process.exit(1);
      }
    });
}
