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
  SILENT = 'silent'
}

// Type mapping from our LogLevel to Pino's Level
type PinoLevel = pino.Level | 'silent';

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
    case LogLevel.SILENT:
      return 'silent';
    default:
      return 'info';
  }
}

/**
 * Configuration options for the logger
 */
export interface LoggerOptions {
  /** Log level to use */
  level?: LogLevel;
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
}

/**
 * Centralized logger for the CLI package
 * Handles all logging operations with support for different levels and output formats
 * Maintains separation from the output formatter which handles command results
 */
export class Logger {
  private logger: pino.Logger;
  private options: LoggerOptions;

  /**
   * Create a new logger instance
   * @param options Configuration options for the logger
   */
  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: options.level || LogLevel.INFO,
      quiet: options.quiet || false,
      color: options.color !== false, // Default to true
      output: options.output || process.stdout,
      errorOutput: options.errorOutput || process.stderr,
      verbose: options.verbose || false
    };

    // Determine the effective log level
    let effectiveLevel = this.options.verbose ? LogLevel.DEBUG : this.options.level || LogLevel.INFO;
    if (this.options.quiet) {
      effectiveLevel = LogLevel.ERROR;
    }

    // Convert to Pino level
    const pinoLevel = toPinoLevel(effectiveLevel);

    // Configure Pino logger
    const pinoOptions: pino.LoggerOptions = {
      level: pinoLevel,
      // Disable logging completely if level is SILENT
      enabled: pinoLevel !== 'silent'
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
            ignore: 'pid,hostname'
          }
        }
      });
    } else {
      // Setup multi-stream logging using Pino's built-in support
      const streams: pino.StreamEntry[] = [];

      // Regular logs go to stdout (with null check)
      if (this.options.output) {
        streams.push({
          level: pinoLevel === 'silent' ? 'error' : pinoLevel, // Avoid using 'silent' as a level
          stream: this.options.output
        });
      }

      // Error logs always go to stderr (with null check)
      if (pinoLevel !== 'silent' && this.options.errorOutput) {
        streams.push({
          level: 'error',
          stream: this.options.errorOutput
        });
      }

      // Create logger with multiple streams
      this.logger = pino(
        pinoOptions,
        pino.multistream(streams)
      );
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
   * Log an info message
   * @param message Message to log
   * @param args Additional arguments to log
   */
  info(message: string, ...args: unknown[]): void {
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
    const childLogger = new Logger(this.options);
    (childLogger as any).logger = this.logger.child(bindings);
    return childLogger;
  }

  /**
   * Create a logger from command options
   * @param options Command options
   * @returns A new logger instance configured with the command options
   */
  static fromCommandOptions(options: Record<string, unknown>): Logger {
    // Determine the appropriate log level based on command options
    let level = LogLevel.INFO;
    
    if (options.verbose) {
      level = LogLevel.DEBUG;
    } else if (options.quiet || options.silent) {
      level = LogLevel.ERROR;
    }
    
    // If silent mode is enabled, set level to SILENT
    if (options.silent) {
      level = LogLevel.SILENT;
    }
    
    return new Logger({
      level,
      color: options.color !== false,
      verbose: Boolean(options.verbose)
    });
  }
}

// Create a global logger instance with default settings
export const globalLogger = new Logger();

/**
 * Reconfigure the global logger with new options
 * @param options New options for the global logger
 */
export function configureGlobalLogger(options: LoggerOptions): void {
  Object.assign(globalLogger, new Logger(options));
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
    }
  });
  
  const logger = new Logger({
    output: testStream as unknown as NodeJS.WriteStream,
    errorOutput: testStream as unknown as NodeJS.WriteStream,
    color: false
  });
  
  return { 
    logger, 
    output,
    getOutput: () => output,
    clearOutput: () => { output = ''; }
  };
}
