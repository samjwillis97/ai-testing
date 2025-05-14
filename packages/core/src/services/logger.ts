/**
 * Implementation of the LogEmitter interface for the SHCClient
 */

import { EventEmitter } from 'events';
import type { LogEmitter, LogLevel, LogEvent } from '../types/log-emitter.types';

/**
 * A logger that emits log events through an EventEmitter
 */
export class ClientLogger implements LogEmitter {
  private eventEmitter: EventEmitter;
  private source: string;

  /**
   * Create a new ClientLogger
   * @param eventEmitter The event emitter to use for emitting log events
   * @param source The source identifier for this logger
   */
  constructor(eventEmitter: EventEmitter, source: string) {
    this.eventEmitter = eventEmitter;
    this.source = source;
  }

  /**
   * Log a message at the specified level
   * @param level The log level
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const logEvent: LogEvent = {
      level,
      message,
      source: this.source,
      timestamp: Date.now(),
      metadata
    };

    // Emit both specific and general log events
    this.eventEmitter.emit(`log:${level}`, logEvent);
    this.eventEmitter.emit('log', logEvent);
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }

  /**
   * Create a new logger with a specific source
   * @param subSource The source identifier for the new logger
   * @returns A new LogEmitter with the specified source
   */
  createLogger(subSource: string): LogEmitter {
    return new ClientLogger(this.eventEmitter, `${this.source}:${subSource}`);
  }
}

/**
 * A logger that does nothing
 * Useful as a fallback when no logger is provided
 */
export class NoopLogger implements LogEmitter {
  /**
   * Log a message at the specified level (does nothing)
   */
  log(): void {
    // Do nothing
  }

  /**
   * Log a debug message (does nothing)
   */
  debug(): void {
    // Do nothing
  }

  /**
   * Log an info message (does nothing)
   */
  info(): void {
    // Do nothing
  }

  /**
   * Log a warning message (does nothing)
   */
  warn(): void {
    // Do nothing
  }

  /**
   * Log an error message (does nothing)
   */
  error(): void {
    // Do nothing
  }

  /**
   * Create a new logger with a specific source (returns self)
   * @returns This logger instance
   */
  createLogger(): LogEmitter {
    return this;
  }
}
