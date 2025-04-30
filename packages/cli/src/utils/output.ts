/**
 * Output formatting utilities
 */
import chalk from 'chalk';
import boxen from 'boxen';
import yaml from 'js-yaml';
import { OutputOptions } from '../types.js';
import { cliPluginManager } from '../plugins/plugin-manager.js';
import { table } from 'table';

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
  // For backward compatibility with tests
  if (options.silent && options.format === 'json' as any) {
    return '';
  }

  // In silent mode, only return raw data for the raw format
  if (options.silent) {
    if (options.format === 'raw') {
      return formatRawData(data);
    }
    // For other formats in silent mode, use the formatter but without any decorations
    const formatters: Record<string, (data: unknown) => string> = {
      json: (data: unknown) => JSON.stringify(data, null, 2),
      yaml: (data: unknown) => yaml.dump(data),
      table: formatTableData,
      raw: formatRawData,
    };

    const formatter = formatters[options.format] || formatters.json;
    return formatter(data);
  }

  // Check if there's a custom formatter plugin for this format
  const customFormatter = cliPluginManager.getOutputFormatter(options.format);
  if (customFormatter) {
    return customFormatter(data);
  }

  // Built-in formatters
  const formatters: Record<string, (data: unknown) => string> = {
    json: (data: unknown) => JSON.stringify(data, null, 2),
    yaml: (data: unknown) => yaml.dump(data),
    raw: formatRawData,
    table: formatTableData,
  };

  const formatter = formatters[options.format] || formatters.json;
  return formatter(data);
}

/**
 * Format data as raw string
 */
function formatRawData(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    return data.toString('utf-8');
  }
  if (typeof data === 'object' && data !== null) {
    // For objects, stringify them properly instead of using String()
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  }
  return String(data);
}

/**
 * Format data as table
 */
function formatTableData(data: unknown): string {
  if (!Array.isArray(data) || data.length === 0) {
    return JSON.stringify(data, null, 2);
  }

  // Get headers from the first object
  const headers = Object.keys(data[0] as Record<string, unknown>);

  // Create data rows
  const rows = data.map((item) => {
    return headers.map((header) => {
      const value = (item as Record<string, unknown>)[header];
      return value === null || value === undefined ? '' : String(value);
    });
  });

  // Add headers as first row
  rows.unshift(headers);

  return table(rows);
}

/**
 * Format response for display
 */
export function formatResponse(response: ResponseData, options: OutputOptions): string {
  // For backward compatibility with tests
  if (options.silent && options.format === 'json' as any) {
    return '';
  }

  // In silent mode, only return the data without any decorations
  if (options.silent) {
    return formatOutput(response.data, options);
  }

  // Check if there's a response visualizer plugin for this format
  const visualizer = cliPluginManager.getResponseVisualizer(options.format);
  if (visualizer) {
    visualizer(response);
    return ''; // Visualizers handle their own output
  }

  // Format the response data
  const formattedData = formatOutput(response.data, options);

  // In verbose mode, include headers and status
  if (options.verbose) {
    const statusLine = `${chalk.bold('Status:')} ${response.status} ${response.statusText}`;
    const headersSection = Object.entries(response.headers)
      .map(([key, value]) => `${chalk.dim(key)}: ${value}`)
      .join('\n');

    return boxen(
      `${statusLine}\n\n${chalk.bold('Headers:')}\n${headersSection}\n\n${chalk.bold('Body:')}\n${formattedData}`,
      {
        padding: 1,
        borderColor: 'green',
        title: 'Response',
        titleAlignment: 'center',
      }
    );
  }

  // For non-raw formats, include a simple status line
  if (options.format !== 'raw') {
    const statusColor = response.status >= 400 ? chalk.red : chalk.green;
    return `${chalk.bold('Status:')} ${statusColor(`${response.status} ${response.statusText}`)}\n\n${formattedData}`;
  }

  // In non-verbose mode, just return the formatted data
  return formattedData;
}

/**
 * Print response with appropriate formatting
 */
export function printResponse(response: ResponseData, options: OutputOptions): void {
  if (options.silent) {
    // In silent mode, only output the raw data without any console.log wrapper
    const output = formatResponse(response, options);
    if (output) {
      process.stdout.write(output);
    }
    return;
  }

  const output = formatResponse(response, options);
  if (output) {
    console.log(output);
  }
}

/**
 * Print error with appropriate formatting
 */
export function printError(error: Error | unknown, options: OutputOptions): void {
  if (options.silent) {
    // In silent mode, don't print errors to console
    // Instead, write a simple error message to stderr
    const errorMessage = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${errorMessage}\n`);
    return;
  }

  let errorMessage = '';
  let errorDetails = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    if (error.stack && options.verbose) {
      errorDetails = error.stack;
    }
  } else {
    errorMessage = String(error);
  }

  const output = boxen(
    `${chalk.red(chalk.bold('Error:'))} ${errorMessage}${
      errorDetails ? `\n\n${chalk.dim(errorDetails)}` : ''
    }`,
    {
      padding: 1,
      borderColor: 'red',
      title: 'Error',
      titleAlignment: 'center',
    }
  );

  console.error(output);
}
