/**
 * Output formatting utilities
 */
import chalk from 'chalk';
import boxen from 'boxen';
import yaml from 'js-yaml';
import { OutputOptions } from '../types.js';

/**
 * Response data type
 */
interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
}

/**
 * Format response data according to output options
 */
export function formatOutput(data: unknown, options: OutputOptions): string {
  if (options.silent) {
    return '';
  }

  const formatters: Record<string, (data: unknown) => string> = {
    json: (data: unknown) => JSON.stringify(data, null, 2),
    yaml: (data: unknown) => yaml.dump(data),
    raw: (data: unknown) => {
      if (typeof data === 'string') {
        return data;
      }
      if (Buffer.isBuffer(data)) {
        return data.toString('utf-8');
      }
      return String(data);
    },
    table: (data: unknown) => {
      if (
        Array.isArray(data) &&
        data.length > 0 &&
        typeof data[0] === 'object' &&
        data[0] !== null
      ) {
        // Simple table formatting for arrays of objects
        const keys = Object.keys(data[0] as Record<string, unknown>);
        const header = keys.join('\t');
        const rows = data.map((item) =>
          keys.map((key) => String((item as Record<string, unknown>)[key] || '')).join('\t')
        );
        return [header, ...rows].join('\n');
      }
      return JSON.stringify(data, null, 2);
    },
  };

  const formatter = formatters[options.format] || formatters.json;
  const output = formatter(data);

  if (!options.color) {
    return output;
  }

  return output;
}

/**
 * Print response with appropriate formatting
 */
export function printResponse(response: ResponseData, options: OutputOptions): void {
  if (options.silent) {
    return;
  }

  // Print status and headers if verbose
  if (options.verbose) {
    const statusColor =
      response.status >= 400 ? 'red' : response.status >= 300 ? 'yellow' : 'green';
    console.log(
      boxen(
        `${chalk[statusColor](response.status)} ${chalk.bold(response.statusText)}\n\n${Object.entries(
          response.headers
        )
          .map(([key, value]) => `${chalk.dim(key)}: ${value}`)
          .join('\n')}`,
        {
          title: 'Response',
          titleAlignment: 'center',
          padding: 1,
          borderColor: statusColor,
        }
      )
    );
  }

  // Print response body
  console.log(formatOutput(response.data, options));
}

/**
 * Print error with appropriate formatting
 */
export function printError(error: Error | unknown, options: OutputOptions): void {
  if (options.silent) {
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorObj =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };

  if (options.verbose) {
    console.error(
      boxen(formatOutput(errorObj, { ...options, format: 'json' }), {
        title: 'Error',
        titleAlignment: 'center',
        padding: 1,
        borderColor: 'red',
      })
    );
  } else {
    console.error(chalk.red(`Error: ${errorMessage}`));
  }
}
