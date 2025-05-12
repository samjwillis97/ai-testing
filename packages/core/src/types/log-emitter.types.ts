/**
 * Types for the event-based logging system
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LogEmitter {
  /**
   * Log a message at the specified level
   * @param level The log level
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void;
  
  /**
   * Log a debug message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  debug(message: string, metadata?: Record<string, unknown>): void;
  
  /**
   * Log an info message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  info(message: string, metadata?: Record<string, unknown>): void;
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  warn(message: string, metadata?: Record<string, unknown>): void;
  
  /**
   * Log an error message
   * @param message The message to log
   * @param metadata Optional metadata to include with the log
   */
  error(message: string, metadata?: Record<string, unknown>): void;
  
  /**
   * Create a new logger with a specific source
   * @param source The source identifier for the new logger
   * @returns A new LogEmitter with the specified source
   */
  createLogger(source: string): LogEmitter;
}
