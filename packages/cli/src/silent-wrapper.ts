/**
 * Silent Mode Wrapper
 *
 * This module provides a wrapper function to execute code in silent mode,
 * completely suppressing all console output.
 */

/**
 * Execute a function in silent mode, suppressing all console output
 * @param fn Function to execute in silent mode
 * @returns The result of the function
 */
export async function executeSilently<T>(fn: () => Promise<T>): Promise<T> {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Create no-op functions for silent mode
  const noopConsole = {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };

  // Override all console methods
  console.log = noopConsole.log;
  console.info = noopConsole.info;
  console.warn = noopConsole.warn;
  console.error = noopConsole.error;
  console.debug = noopConsole.debug;

  try {
    // Execute the function in silent mode
    return await fn();
  } finally {
    // Always restore console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  }
}
