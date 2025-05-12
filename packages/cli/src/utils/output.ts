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
 * Safely stringify an object, handling circular references
 * @param obj The object to stringify
 * @returns A JSON string representation of the object
 */
export function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    return value;
  }, 2);
}


/**
 * Format response data according to output options
 */
export function formatOutput(data: unknown, options: OutputOptions): string {
  // Built-in formatters
  const formatters: Record<string, (data: unknown) => string> = {
    json: formatJsonData,
    yaml: formatYamlData,
    table: formatTableData,
    raw: formatRawData,
  };

  // Format the data according to the specified format

  // Check if there's a custom formatter plugin for this format
  const customFormatter = cliPluginManager.getOutputFormatter(options.format);
  const formatter = customFormatter ?? formatters[options.format] ?? formatters.json;
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
 * Format data as JSON
 */
function formatJsonData(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format data as YAML
 */
function formatYamlData(data: unknown): string {
  return yaml.dump(data);
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
  // Check if there's a response visualizer plugin for this format
  const visualizer = cliPluginManager.getResponseVisualizer(options.format);
  if (visualizer) {
    return visualizer(response.data);
  }

  // Format the response data
  const formattedData = formatOutput(response.data, options);

  // In quiet mode, return only the formatted data without any additional information
  if (options.quiet) {
    return formattedData;
  }

  // In verbose mode, include headers
  if (options.verbose) {
    const statusLine = `${chalk.bold('Status:')} ${response.status} ${response.statusText}`;
    const headersFormatted = Object.entries(response.headers)
      .map(([key, value]) => `${chalk.dim(key)}: ${value}`)
      .join('\n');

    return `${statusLine}\n\n${chalk.bold('Headers:')}\n${headersFormatted}\n\n${chalk.bold('Body:')}\n${formattedData}`;
  }

  // In normal mode, include basic status and the formatted data
  const statusLine = `${chalk.bold('Status:')} ${response.status} ${response.statusText}`;
  return `${statusLine}\n\n${formattedData}`;
}

/**
 * Print response with appropriate formatting
 */
export async function printResponse(response: ResponseData, options: OutputOptions): Promise<void> {
  // In quiet mode, only output the raw data without any formatting or status information
  if (options.quiet) {
    // Format the data according to the specified format
    const formattedData = formatOutput(response.data, options);
    // Write directly to stdout without any status information
    process.stdout.write(formattedData + '\n');
    return;
  }
  
  // For normal mode, use the standard formatting
  const output = formatResponse(response, options);
  if (!output) {
    return;
  }
  
  // Use console.log for normal output
  console.log(output);
}

/**
 * Print error with appropriate formatting
 */
export function printError(error: Error | unknown, options: OutputOptions): void {
  // In quiet mode, output minimal error message to stderr in the specified format
  if (options.quiet) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorOutput =
      options.format === 'json'
        ? JSON.stringify({ error: errorMessage })
        : options.format === 'yaml'
          ? `error: ${errorMessage}`
          : `Error: ${errorMessage}`;
    process.stderr.write(`${errorOutput}\n`);
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
