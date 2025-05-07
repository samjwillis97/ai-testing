/**
 * Spinner utility for the CLI package
 * Integrates with the centralized logging system
 */
import ora, { Ora, Options as OraOptions } from 'ora';
import chalk from 'chalk';
import { Logger, LogLevel } from './logger.js';

/**
 * Options for creating a spinner
 */
export interface SpinnerOptions extends OraOptions {
  /** Whether to enable the spinner (defaults to true) */
  enabled?: boolean;
  /** Logger instance to use */
  logger?: Logger;
  /** Log level to use for spinner messages */
  logLevel?: LogLevel;
}

/**
 * Spinner class that integrates with the Logger
 * Provides a consistent interface for showing progress and status updates
 */
export class Spinner {
  private spinner: Ora | null = null;
  private spinnerText: string;
  private logger: Logger;

  /**
   * Create a new spinner
   * @param text Text to display next to the spinner
   * @param options Options for the spinner
   */
  constructor(text: string, options: SpinnerOptions = {}) {
    this.spinnerText = text;
    this.logger = options.logger || Logger.getInstance();

    // Only create the spinner if enabled
    if (options.enabled !== false) {
      this.spinner = ora({
        text,
        ...options,
      });
    }
  }

  /**
   * Start the spinner
   * @returns This spinner instance for chaining
   */
  start(): Spinner {
    if (this.spinner) {
      this.spinner.start();
    } else {
      this.logger.info(this.spinnerText);
    }
    return this;
  }

  /**
   * Stop the spinner and show a success message
   * @param text Success message (optional)
   * @returns This spinner instance for chaining
   */
  succeed(text?: string): Spinner {
    const message = text || this.spinnerText;
    if (this.spinner) {
      this.spinner.succeed(message);
    } else {
      // Use the appropriate log level method
      this.logger.info(chalk.green('✓') + ' ' + message);
    }
    return this;
  }

  /**
   * Stop the spinner and show a failure message
   * @param text Failure message (optional)
   * @returns This spinner instance for chaining
   */
  fail(text?: string): Spinner {
    const message = text || this.spinnerText;
    if (this.spinner) {
      this.spinner.fail(message);
    } else {
      this.logger.error(chalk.red('✗') + ' ' + message);
    }
    return this;
  }

  /**
   * Stop the spinner and show a warning message
   * @param text Warning message (optional)
   * @returns This spinner instance for chaining
   */
  warn(text?: string): Spinner {
    const message = text || this.spinnerText;
    if (this.spinner) {
      this.spinner.warn(message);
    } else {
      this.logger.warn(chalk.yellow('⚠') + ' ' + message);
    }
    return this;
  }

  /**
   * Stop the spinner and show an info message
   * @param text Info message (optional)
   * @returns This spinner instance for chaining
   */
  info(text?: string): Spinner {
    const message = text || this.spinnerText;
    if (this.spinner) {
      this.spinner.info(message);
    } else {
      this.logger.info(chalk.blue('ℹ') + ' ' + message);
    }
    return this;
  }

  /**
   * Update the spinner text
   * @param newText New text to display
   * @returns This spinner instance for chaining
   */
  setText(newText: string): Spinner {
    this.spinnerText = newText;
    if (this.spinner) {
      this.spinner.text = newText;
    }
    return this;
  }

  /**
   * Stop the spinner
   * @param clear Whether to clear the spinner (defaults to false)
   * @returns This spinner instance for chaining
   */
  stop(clear = false): Spinner {
    if (this.spinner) {
      this.spinner.stop();
      if (clear) {
        this.spinner.clear();
      }
    }
    return this;
  }

  /**
   * Create a spinner from command options
   * @param text Text to display next to the spinner
   * @param options Command options
   * @returns A new spinner instance configured with the command options
   */
  static fromCommandOptions(text: string, options: Record<string, unknown>): Spinner {
    const logger = Logger.fromCommandOptions(options);

    // Enable spinner only if not in quiet mode
    // We determine this based on the quiet flag in options
    const enabled = !options.quiet;

    return new Spinner(text, {
      enabled,
      logger,
      color: options.color !== false ? 'cyan' : undefined,
    });
  }
}
