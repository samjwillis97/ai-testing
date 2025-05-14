/**
 * Test script for logger quiet mode
 */
import { globalLogger, configureGlobalLogger, LogLevel } from './src/utils/logger.js';

// Test with normal mode
console.log('--- NORMAL MODE ---');
configureGlobalLogger({
  level: LogLevel.INFO,
  quiet: false,
});

globalLogger.debug('This is a debug message (should not show in normal mode)');
globalLogger.info('This is an info message (should show in normal mode)');
globalLogger.warn('This is a warning message (should show in normal mode)');
globalLogger.error('This is an error message (should show in normal mode)');

// Test with quiet mode
console.log('\n--- QUIET MODE ---');
configureGlobalLogger({
  level: LogLevel.ERROR,
  quiet: true,
});

globalLogger.debug('This is a debug message (should not show in quiet mode)');
globalLogger.info('This is an info message (should not show in quiet mode)');
globalLogger.warn('This is a warning message (should not show in quiet mode)');
globalLogger.error('This is an error message (should show in quiet mode)');
