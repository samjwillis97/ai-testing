import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Logger,
  LogLevel,
  createTestLogger,
  globalLogger,
  configureGlobalLogger,
} from '../../src/utils/logger';
import { Writable } from 'stream';

describe('Logger', () => {
  describe('Basic functionality', () => {
    it('should create a logger with default options', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should respect log level settings', () => {
      const { logger, getOutput, clearOutput } = createTestLogger();

      // Set to INFO level
      (logger as any).logger.level = 'info';

      // Debug should not be logged
      logger.debug('Debug message');
      expect(getOutput()).toBe('');

      // Info should be logged
      clearOutput();
      logger.info('Info message');
      expect(getOutput()).toContain('Info message');

      // Warning should be logged
      clearOutput();
      logger.warn('Warning message');
      expect(getOutput()).toContain('Warning message');

      // Error should be logged
      clearOutput();
      logger.error('Error message');
      expect(getOutput()).toContain('Error message');
    });
  });

  describe('Quiet mode', () => {
    it('should only log errors in quiet mode', () => {
      // Create a stream to capture output
      let output = '';
      const testStream = new Writable({
        write(chunk, encoding, callback) {
          output += chunk.toString();
          callback();
        },
      });

      const logger = new Logger({
        quiet: true,
        output: testStream as unknown as NodeJS.WriteStream,
        errorOutput: testStream as unknown as NodeJS.WriteStream,
        color: false,
      });

      // Debug, info, and warn should not be logged
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      expect(output).toBe('');

      // Error should be logged
      logger.error('Error message');
      expect(output).toContain('Error message');
    });
  });

  describe('fromCommandOptions', () => {
    it('should create a logger from command options', () => {
      const logger = Logger.fromCommandOptions({
        verbose: true,
        quiet: false,
        color: true,
      });

      expect(logger).toBeInstanceOf(Logger);
      // Check that options were applied correctly
      expect((logger as any).options.level).toBe(LogLevel.DEBUG);
      expect((logger as any).options.quiet).toBe(false);
      expect((logger as any).options.color).toBe(true);
    });

    it('should prioritize quiet mode over verbose', () => {
      const logger = Logger.fromCommandOptions({
        verbose: true,
        quiet: true,
      });

      expect((logger as any).options.quiet).toBe(true);
      // Even though verbose is true, the effective level should be ERROR due to quiet mode
      expect((logger as any).logger.level).toBe('error');
    });
  });

  describe('Child loggers', () => {
    it('should create child loggers with additional context', () => {
      const { logger, getOutput, clearOutput } = createTestLogger();

      const childLogger = logger.child({ module: 'test-module' });
      childLogger.info('Child logger message');

      const output = getOutput();
      expect(output).toContain('Child logger message');
      expect(output).toContain('test-module');
    });
  });

  describe('Global logger', () => {
    it('should export a global logger instance', () => {
      // Import the global logger directly
      expect(globalLogger).toBeInstanceOf(Logger);
    });

    it('should allow reconfiguring the global logger', () => {
      // Store original logger to restore later
      const originalOptions = { ...(globalLogger as any).options };

      // Configure with new options
      configureGlobalLogger({
        level: LogLevel.DEBUG,
        quiet: true,
      });

      // Check that options were applied
      expect((globalLogger as any).options.level).toBe(LogLevel.DEBUG);
      expect((globalLogger as any).options.quiet).toBe(true);

      // Restore original logger to not affect other tests
      configureGlobalLogger(originalOptions);
    });
  });
});
