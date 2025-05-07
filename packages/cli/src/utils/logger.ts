/**
 * Centralized logging system for the CLI package
 * Uses Pino for efficient logging with support for different levels and output formats
 */
import pino from 'pino';
import { Writable } from 'stream';

/**
 * Log levels supported by the logger
 * These match Pino's level strings
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Type mapping from our LogLevel to Pino's Level
type PinoLevel = pino.Level;

// Convert LogLevel to Pino Level
function toPinoLevel(level: LogLevel): PinoLevel {
  switch (level) {
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';
    default:
      return 'info';
  }
}

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  /** Whether to enable quiet mode (only errors to stderr) */
  quiet?: boolean;
  /** Whether to use colors in output */
  color?: boolean;
  /** Custom output stream for logs */
  output?: NodeJS.WriteStream;
  /** Custom error output stream */
  errorOutput?: NodeJS.WriteStream;
  /** Whether to enable verbose mode */
  verbose?: boolean;
  /** Log level */
  level?: LogLevel;
}

/**
 * Centralized logger for the CLI package
 * Handles all logging operations with support for different levels and output formats
 * Maintains separation from the output formatter which handles command results
 */
export class Logger {
  private logger!: pino.Logger; // Using the definite assignment assertion
  private options: LoggerOptions;
  private static instance: Logger | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * @param options Configuration options for the logger
   * @param isTestInstance Whether this is a test instance (bypasses singleton)
   */
  private constructor(options: LoggerOptions = {}, isTestInstance = false) {
    this.options = {
      quiet: options.quiet || false,
      color: options.color !== false, // Default to true
      output: options.output || process.stdout,
      errorOutput: options.errorOutput || process.stderr,
      verbose: options.verbose || false,
    };

    this.initializeLogger();

    // Store as singleton if this is not a test instance
    if (!isTestInstance && !Logger.instance) {
      Logger.instance = this;
    }
  }

  /**
   * Get the singleton logger instance
   * @param options Configuration options for the logger
   * @returns The singleton logger instance
   */
  public static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options || {});
    } else if (options) {
      // Reconfigure the existing instance if options are provided
      Logger.instance.configure(options);
    }
    return Logger.instance;
  }

  /**
   * Create a test instance of the logger
   * This bypasses the singleton pattern for testing purposes
   * @param options Logger options for the test instance
   * @returns A new logger instance for testing
   */
  public static createTestInstance(options: LoggerOptions = {}): Logger {
    return new Logger(options, true);
  }

  /**
   * Reconfigure the logger with new options
   * @param options New configuration options
   */
  public configure(options: LoggerOptions): void {
    // Update options
    this.options = {
      ...this.options,
      ...options,
    };

    // Reinitialize the logger with new options
    this.initializeLogger();
  }

  /**
   * Initialize the Pino logger with current options
   */
  private initializeLogger(): void {
    // Determine the effective log level
    let effectiveLevel = this.options.verbose
      ? LogLevel.DEBUG
      : LogLevel.INFO;
    if (this.options.quiet) {
      effectiveLevel = LogLevel.ERROR;
    }

    // Convert to Pino level
    const pinoLevel = toPinoLevel(effectiveLevel);
    
    // Force the log level to 'error' when in quiet mode to ensure all INFO logs are suppressed
    const finalPinoLevel = this.options.quiet ? 'error' : pinoLevel;

    // Configure Pino logger
    const pinoOptions: pino.LoggerOptions = {
      level: finalPinoLevel,
    };

    // Configure pretty printing if color is enabled
    if (this.options.color) {
      this.logger = pino({
        ...pinoOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: true,
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      // Setup multi-stream logging using Pino's built-in support
      const streams: pino.StreamEntry[] = [];

      // Regular logs go to stdout (with null check)
      if (this.options.output) {
        streams.push({
          level: finalPinoLevel,
          stream: this.options.output,
        });
      }

      // Error logs always go to stderr (with null check)
      if (this.options.errorOutput) {
        streams.push({
          level: 'error',
          stream: this.options.errorOutput,
        });
      }

      // Create logger with multiple streams
      this.logger = pino(pinoOptions, pino.multistream(streams));
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param args Additional arguments to log
   */
  debug(message: string, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  /**
   * Log an informational message
   * @param message Message to log
   * @param args Additional arguments to log
   */
  public info(message: string, ...args: unknown[]): void {
    // Skip INFO logs in quiet mode - direct check to ensure consistency
    if (this.options.quiet === true) {
      return;
    }
    this.logger.info(message, ...args);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param args Additional arguments to log
   */
  warn(message: string, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param args Additional arguments to log
   */
  error(message: string, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }

  /**
   * Create a child logger with additional context
   * @param bindings Additional context to include with log messages
   * @returns A new logger instance with the additional context
   */
  child(bindings: Record<string, unknown>): Logger {
    // For child loggers, we create a new instance directly without using the singleton
    // This is intentional as child loggers should not replace the global instance
    const childLogger = Logger.createTestInstance(this.options);

    // Use Object.defineProperty to set the private property
    Object.defineProperty(childLogger, 'logger', {
      value: this.logger.child(bindings),
      writable: true,
      configurable: true,
    });

    return childLogger;
  }

  /**
   * Create a logger from command options
   * @param options Command options
   * @returns A logger instance configured with the command options
   */
  /**
   * Check if the logger is in quiet mode
   * @returns True if the logger is in quiet mode, false otherwise
   */
  isQuietMode(): boolean {
    return this.options.quiet === true;
  }

  static fromCommandOptions(options: Record<string, unknown>): Logger {
    // Determine the appropriate log level based on command options
    let level = LogLevel.INFO;

    if (options.verbose) {
      level = LogLevel.DEBUG;
    } else if (options.quiet) {
      level = LogLevel.ERROR;
    }

    // Use the singleton pattern
    return Logger.getInstance({
      color: options.color !== false,
      verbose: Boolean(options.verbose),
      quiet: Boolean(options.quiet),
    });
  }

  get level(): pino.LevelWithSilentOrString {
    return this.logger.level;
  }

  // The createTestInstance method is now defined at the class level above
}

// Create a global logger instance with default settings
// export const globalLogger = Logger.getInstance();

/**
 * Configure the global logger with new options
 * @param options New configuration options
 */
export function configureGlobalLogger(options: LoggerOptions): void {
  // Use the getInstance method which will reconfigure the existing instance
  Logger.getInstance(options);
}

/**
 * Create a test logger that captures output for testing
 * @returns A logger and the captured output
 */
export function createTestLogger(): {
  logger: Logger;
  output: string;
  getOutput: () => string;
  clearOutput: () => void;
} {
  let output = '';

  const testStream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });

  // Use a special accessor method for testing purposes
  const logger = Logger.createTestInstance({
    output: testStream as unknown as NodeJS.WriteStream,
    errorOutput: testStream as unknown as NodeJS.WriteStream,
    color: false,
  });

  return {
    logger,
    output,
    getOutput: () => output,
    clearOutput: () => {
      output = '';
    },
  };
}
