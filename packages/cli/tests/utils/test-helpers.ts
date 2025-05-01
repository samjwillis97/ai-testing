/**
 * Test helpers for CLI tests
 * Provides utilities for testing CLI commands
 */
import { Command } from 'commander';
import { vi } from 'vitest';
import { makeProgram } from '../../src/utils/program.js';

/**
 * Options for creating a test program
 */
export interface TestProgramOptions {
  /**
   * Whether to initialize plugins
   */
  initPlugins?: boolean;
  
  /**
   * Whether to capture console output
   */
  captureOutput?: boolean;
  
  /**
   * Whether to mock process.exit
   */
  mockExit?: boolean;
}

/**
 * Captured console output
 */
export interface CapturedOutput {
  /**
   * Captured console.log messages
   */
  logs: string[];
  
  /**
   * Captured console.error messages
   */
  errors: string[];
  
  /**
   * Captured console.warn messages
   */
  warnings: string[];
  
  /**
   * Captured console.info messages
   */
  infos: string[];
  
  /**
   * Captured process.exit codes
   */
  exitCodes: number[];
  
  /**
   * Clear all captured output
   */
  clear: () => void;
}

/**
 * Create a test program with mocked console and process.exit
 * @param options Options for creating the test program
 * @returns A tuple containing the program and captured output
 */
export async function createTestProgram(
  options: TestProgramOptions = {}
): Promise<[Command, CapturedOutput]> {
  // Initialize captured output
  const captured: CapturedOutput = {
    logs: [],
    errors: [],
    warnings: [],
    infos: [],
    exitCodes: [],
    clear: () => {
      captured.logs = [];
      captured.errors = [];
      captured.warnings = [];
      captured.infos = [];
      captured.exitCodes = [];
    },
  };
  
  // Create mock console methods if capturing output
  const mockConsole = options.captureOutput
    ? {
        log: (message?: any) => {
          const strMessage = String(message);
          captured.logs.push(strMessage);
          // Still log to console for debugging
          console.info(`[Captured log]: ${strMessage}`);
        },
        error: (message?: any) => {
          const strMessage = String(message);
          captured.errors.push(strMessage);
          // Still log to console for debugging
          console.info(`[Captured error]: ${strMessage}`);
        },
        warn: (message?: any) => {
          const strMessage = String(message);
          captured.warnings.push(strMessage);
          // Still log to console for debugging
          console.info(`[Captured warning]: ${strMessage}`);
        },
        info: (message?: any) => {
          const strMessage = String(message);
          captured.infos.push(strMessage);
          // Still log to console for debugging
          console.info(`[Captured info]: ${strMessage}`);
        },
      }
    : undefined;
  
  // Create mock exit function if mocking process.exit
  const mockExit = options.mockExit
    ? ((code = 0) => {
        captured.exitCodes.push(code);
        throw new Error(`Process exited with code ${code}`);
      })
    : undefined;
  
  // Create the program
  const program = await makeProgram({
    exitOverride: true,
    suppressOutput: false, // Don't suppress output so we can capture it
    initPlugins: options.initPlugins,
    mockConsole,
    mockExit,
  });
  
  return [program, captured];
}

/**
 * Run a command with the given program and arguments
 * @param program The Commander program
 * @param args Command line arguments
 * @returns The result of parsing the arguments
 */
export async function runCommand(program: Command, args: string[]): Promise<any> {
  // Commander expects the first two arguments to be node and script name
  // If they're not provided, add them to avoid "unknown command" errors
  const fullArgs = args.length >= 2 ? args : ['node', 'shc', ...args];
  return program.parseAsync(fullArgs, { from: 'user' });
}

/**
 * Mock the configuration utilities
 * @returns An object containing the mocked functions
 */
export function mockConfigUtils() {
  return {
    createConfigManagerFromOptions: vi.fn().mockResolvedValue({
      loadFromFile: vi.fn(),
      get: vi.fn((path, defaultValue) => {
        if (path === 'storage.collections.path') return './test-collections';
        return defaultValue;
      }),
      set: vi.fn(),
    }),
    getEffectiveOptions: vi.fn().mockReturnValue({
      config: './test-config.yml',
      verbose: false,
      silent: false,
      output: 'json',
    }),
    getCollectionDir: vi.fn().mockReturnValue('./test-collections'),
  };
}

/**
 * Mock the collections utilities
 * @returns An object containing the mocked functions
 */
export function mockCollectionsUtils() {
  return {
    getCollections: vi.fn().mockResolvedValue(['collection1', 'collection2']),
    getRequests: vi.fn().mockResolvedValue([
      { id: 'request1', name: 'Request 1', method: 'GET' },
      { id: 'request2', name: 'Request 2', method: 'POST' },
    ]),
  };
}
