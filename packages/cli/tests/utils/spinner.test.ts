/**
 * Tests for the spinner utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Spinner, SpinnerOptions } from '../../src/utils/spinner.js';
import { Logger, LogLevel } from '../../src/utils/logger.js';
import chalk from 'chalk';

// Mock ora
vi.mock('ora', () => {
  return {
    default: vi.fn(() => ({
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      info: vi.fn().mockReturnThis(),
      clear: vi.fn().mockReturnThis(),
      text: '',
    })),
  };
});

describe('Spinner Utility', () => {
  let mockLogger: Logger;
  let loggerInfoSpy: any;
  let loggerWarnSpy: any;
  let loggerErrorSpy: any;
  let loggerDebugSpy: any;

  beforeEach(() => {
    // Create a mock logger with spies
    mockLogger = new Logger();
    loggerInfoSpy = vi.spyOn(mockLogger, 'info').mockImplementation(() => {});
    loggerWarnSpy = vi.spyOn(mockLogger, 'warn').mockImplementation(() => {});
    loggerErrorSpy = vi.spyOn(mockLogger, 'error').mockImplementation(() => {});
    loggerDebugSpy = vi.spyOn(mockLogger, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
  });

  it('creates a spinner with default options', () => {
    const spinner = new Spinner('Loading...');
    expect(spinner).toBeDefined();
  });

  it('creates a spinner with custom options', () => {
    const options: SpinnerOptions = {
      color: 'blue',
      spinner: 'dots',
      logger: mockLogger,
      logLevel: LogLevel.DEBUG,
    };
    const spinner = new Spinner('Loading...', options);
    expect(spinner).toBeDefined();
  });

  it('creates a disabled spinner', () => {
    const spinner = new Spinner('Loading...', { enabled: false, logger: mockLogger });
    expect(spinner).toBeDefined();

    // Test that the spinner uses the logger instead of ora
    spinner.start();
    expect(loggerInfoSpy).toHaveBeenCalled();
  });

  it('starts the spinner', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.start();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a success message', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.succeed('Success!');

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a success message with default text', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.succeed();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a failure message', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.fail('Failed!');

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a failure message with default text', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.fail();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a warning message', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.warn('Warning!');

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows a warning message with default text', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.warn();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows an info message', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.info('Info!');

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('shows an info message with default text', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.info();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('updates the spinner text', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.setText('New text');

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('stops the spinner', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.stop();

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('stops and clears the spinner', () => {
    const spinner = new Spinner('Loading...');
    const result = spinner.stop(true);

    // Check method chaining works
    expect(result).toBe(spinner);
  });

  it('handles disabled spinner for all methods', () => {
    const spinner = new Spinner('Loading...', { enabled: false, logger: mockLogger });

    // Test all methods with disabled spinner
    spinner.start();
    spinner.succeed('Success!');
    spinner.fail('Failed!');
    spinner.warn('Warning!');
    spinner.info('Info!');
    spinner.setText('New text');
    spinner.stop();
    spinner.stop(true);

    // Verify logger was used
    expect(loggerInfoSpy).toHaveBeenCalled();
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalled();
  });
});
