/**
 * Console output utilities for direct user-facing output
 * This module is separate from the logger and is used for command results
 * that should always be displayed to the user regardless of log level.
 */
import chalk from 'chalk';

/**
 * Console output options
 */
export interface ConsoleOptions {
  /** Whether to use colors in output */
  color?: boolean;
  /** Whether quiet mode is enabled */
  quiet?: boolean;
}

/**
 * Console output utility for direct user-facing output
 */
export class Console {
  private options: ConsoleOptions;

  /**
   * Create a new console output utility
   * @param options Console output options
   */
  constructor(options: ConsoleOptions = {}) {
    this.options = {
      color: options.color !== false, // Default to true
      quiet: options.quiet || false,
    };
  }

  /**
   * Print a message to stdout
   * @param message Message to print
   */
  print(message: string): void {
    if (!this.options.quiet) {
      process.stdout.write(`${message}\n`);
    }
  }

  /**
   * Print a message to stdout with a title
   * @param title Title to print
   * @param message Message to print
   */
  printWithTitle(title: string, message: string): void {
    if (!this.options.quiet) {
      const formattedTitle = this.options.color ? chalk.bold(title) : title;
      process.stdout.write(`${formattedTitle}\n${message}\n`);
    }
  }

  /**
   * Print a list of items to stdout
   * @param title Title for the list
   * @param items List items to print
   * @param numbered Whether to number the list items
   */
  printList(title: string, items: string[], numbered = true): void {
    if (!this.options.quiet) {
      const formattedTitle = this.options.color ? chalk.bold(title) : title;
      process.stdout.write(`${formattedTitle}\n`);
      
      items.forEach((item, index) => {
        const prefix = numbered ? `${index + 1}. ` : '- ';
        const formattedPrefix = this.options.color ? chalk.cyan(prefix) : prefix;
        process.stdout.write(`${formattedPrefix}${item}\n`);
      });
      
      // Add an empty line for spacing
      process.stdout.write('\n');
    }
  }

  /**
   * Print an error message to stderr
   * @param message Error message to print
   */
  error(message: string): void {
    const formattedMessage = this.options.color ? chalk.red(message) : message;
    process.stderr.write(`${formattedMessage}\n`);
  }

  /**
   * Create a console output utility from command options
   * @param options Command options
   * @returns A console output utility configured with the command options
   */
  static fromCommandOptions(options: Record<string, unknown>): Console {
    return new Console({
      color: options.color !== false,
      quiet: Boolean(options.quiet),
    });
  }
}
