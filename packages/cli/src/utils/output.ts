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
  if (options.silent) {
    return '';
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
        // Improved table formatting for arrays of objects
        const keys = Object.keys(data[0] as Record<string, unknown>);
        const header = keys.map(key => key);
        const rows = data.map((item) =>
          keys.map((key) => String((item as Record<string, unknown>)[key] || ''))
        );
        
        return table([header, ...rows], {
          border: {
            topBody: '─',
            topJoin: '┬',
            topLeft: '┌',
            topRight: '┐',
            bottomBody: '─',
            bottomJoin: '┴',
            bottomLeft: '└',
            bottomRight: '┘',
            bodyLeft: '│',
            bodyRight: '│',
            bodyJoin: '│',
            joinBody: '─',
            joinLeft: '├',
            joinRight: '┤',
            joinJoin: '┼'
          }
        });
      }
      return JSON.stringify(data, null, 2);
    },
  };

  const formatter = formatters[options.format] || formatters.json;
  return formatter(data);
}

/**
 * Format response for display
 */
export function formatResponse(response: ResponseData, options: OutputOptions): string {
  if (options.silent) {
    return '';
  }

  // Check if there's a response visualizer plugin for this format
  const visualizer = cliPluginManager.getResponseVisualizer(options.format);
  if (visualizer) {
    visualizer(response);
    return ''; // Visualizers handle their own output
  }

  let output = '';

  if (options.verbose) {
    // Format headers
    const headerLines = Object.entries(response.headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    output += boxen(
      `${chalk.bold('Status:')} ${response.status} ${response.statusText}\n\n${chalk.bold(
        'Headers:'
      )}\n${headerLines}`,
      {
        padding: 1,
        borderColor: response.status >= 400 ? 'red' : 'green',
        title: 'Response',
        titleAlignment: 'center',
      }
    );
    output += '\n\n';
  } else {
    output += `${chalk.bold('Status:')} ${
      response.status >= 400
        ? chalk.red(`${response.status} ${response.statusText}`)
        : chalk.green(`${response.status} ${response.statusText}`)
    }\n\n`;
  }

  // Format response data
  output += formatOutput(response.data, options);

  return output;
}

/**
 * Print response with appropriate formatting
 */
export function printResponse(response: ResponseData, options: OutputOptions): void {
  if (options.silent) {
    return;
  }

  const output = formatResponse(response, options);
  console.log(output);
}

/**
 * Print error with appropriate formatting
 */
export function printError(error: Error | unknown, options: OutputOptions): void {
  if (options.silent) {
    return;
  }

  let errorMessage = 'Unknown error';
  let errorDetails = '';

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    try {
      errorMessage = JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
    }
  }

  const output = boxen(
    `${chalk.bold.red('Error:')} ${errorMessage}${
      options.verbose && errorDetails ? `\n\n${chalk.gray(errorDetails)}` : ''
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
