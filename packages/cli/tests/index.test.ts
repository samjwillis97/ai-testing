/**
 * Tests for CLI entry point
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the modules we need to test
vi.mock('../src/utils/program.js', () => ({
  makeProgram: vi.fn().mockResolvedValue({
    help: vi.fn(),
    parseAsync: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../src/silent-wrapper.js', () => ({
  executeSilently: vi.fn().mockImplementation(async (fn) => {
    await fn();
    return undefined;
  }),
}));

// Import the mocked modules
import { makeProgram } from '../src/utils/program.js';
import { executeSilently } from '../src/silent-wrapper.js';

describe('CLI Entry Point', () => {
  // Store original process.argv
  const originalArgv = process.argv;

  beforeEach(() => {
    // Mock console.error and process.exit
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    // Reset mocks before each test
    vi.clearAllMocks();

    // Reset modules to ensure clean state for each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore process.argv after each test
    process.argv = originalArgv;

    // Restore mocks
    vi.restoreAllMocks();
  });

  it('should call makeProgram with initPlugins=true', async () => {
    // Set process.argv to simulate arguments
    process.argv = ['node', 'cli.js', 'command'];

    // Import the index module, which will trigger the main function
    await import('../src/index');

    // Verify that makeProgram was called with the correct arguments
    expect(makeProgram).toHaveBeenCalledWith({ initPlugins: true });
  });

  it('should execute in silent mode when -s flag is provided', async () => {
    // Set process.argv to simulate arguments with silent flag
    process.argv = ['node', 'cli.js', 'command', '-s'];

    // Import the index module, which will trigger the main function
    await import('../src/index');

    // Verify that executeSilently was called
    expect(executeSilently).toHaveBeenCalled();
  });

  it('should execute in silent mode when --silent flag is provided', async () => {
    // Set process.argv to simulate arguments with silent flag
    process.argv = ['node', 'cli.js', 'command', '--silent'];

    // Import the index module, which will trigger the main function
    await import('../src/index');

    // Verify that executeSilently was called
    expect(executeSilently).toHaveBeenCalled();
  });
});
