/**
 * Tests for silent mode in CLI commands
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OutputOptions } from '../../src/types.js';

// Mock SHCClient
vi.mock('@shc/core', () => ({
  SHCClient: {
    create: vi.fn().mockReturnValue({
      request: vi.fn().mockResolvedValue({
        data: { test: 'data' },
        status: 200,
        statusText: 'OK',
        headers: {},
      }),
      on: vi.fn(),
      use: vi.fn(),
    }),
  },
}));

// Import the modules after mocking
import { printResponse } from '../../src/utils/output.js';

describe('CLI Silent Mode', () => {
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;
  let processExitSpy: vi.SpyInstance;
  let stdoutWriteSpy: vi.SpyInstance;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Mock process.stdout.write
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    // Restore all mocks
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    stdoutWriteSpy.mockRestore();

    // Clear all mock calls
    vi.clearAllMocks();
  });

  it('should suppress all output except raw data when silent mode is enabled with raw format', async () => {
    // Create test response
    const testResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { test: 'data' },
    };

    // Execute with silent mode enabled and raw format
    const silentOptions: OutputOptions = {
      format: 'raw',
      color: true,
      verbose: false,
      silent: true,
    };

    // Test printResponse
    printResponse(testResponse, silentOptions);

    // Verify console.log was not called
    expect(consoleLogSpy).not.toHaveBeenCalled();

    // Verify process.stdout.write was called with the raw data
    expect(stdoutWriteSpy).toHaveBeenCalledWith(expect.stringContaining('test'));
  });

  it('should not suppress output when silent mode is disabled', async () => {
    // Create test response
    const testResponse = {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { test: 'data' },
    };

    // Execute with silent mode disabled
    const nonSilentOptions: OutputOptions = {
      format: 'json',
      color: true,
      verbose: false,
      silent: false,
    };

    // Test printResponse
    printResponse(testResponse, nonSilentOptions);

    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
