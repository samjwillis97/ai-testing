/**
 * Quiet Mode Wrapper
 *
 * This module provides a wrapper function to execute code in quiet mode,
 * suppressing most console output except for errors.
 */
import { configureGlobalLogger, LogLevel } from './utils/logger.js';

/**
 * Execute a function in quiet mode, suppressing most console output
 * @param fn Function to execute in quiet mode
 * @returns The result of the function
 */
export async function executeQuietly<T>(fn: () => Promise<T>): Promise<T> {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    debug: console.debug,
  };

  // Create no-op functions for quiet mode
  const noopConsole = {
    log: () => {},
    info: () => {},
    warn: () => {},
    debug: () => {},
  };

  try {
    // Set console methods to no-op for quiet mode
    // Note: We keep console.error to ensure critical errors are still displayed
    console.log = noopConsole.log;
    console.info = noopConsole.info;
    console.warn = noopConsole.warn;
    console.debug = noopConsole.debug;

    // Configure the global logger to ERROR level with quiet mode
    configureGlobalLogger({
      level: LogLevel.ERROR,
      quiet: true,
    });

    // Execute the function
    return await fn();
  } finally {
    // Restore original console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
  }
}
