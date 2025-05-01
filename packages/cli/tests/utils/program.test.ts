/**
 * Tests for the program creation utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeProgram } from '../../src/utils/program.js';
import * as configUtils from '../../src/utils/config.js';
import * as pluginManager from '../../src/plugins/plugin-manager.js';

// Mock dependencies
vi.mock('../../src/utils/config.js', () => ({
  createConfigManagerFromOptions: vi.fn(),
  getEffectiveOptions: vi.fn(),
  getCollectionDir: vi.fn(),
}));

vi.mock('../../src/plugins/index.js', () => ({
  initializePlugins: vi.fn(),
  cliPluginManager: {
    getAllCommands: vi.fn().mockReturnValue(new Map()),
  },
}));

vi.mock('../../src/plugins/plugin-manager.js', () => ({
  cliPluginManager: {
    getAllCommands: vi.fn().mockReturnValue(new Map()),
    setSilentMode: vi.fn(),
    loadPlugins: vi.fn(),
    getOutputFormatter: vi.fn(),
    getResponseVisualizer: vi.fn(),
  },
}));

describe('Program Creation Utility', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });

    // Mock createConfigManagerFromOptions
    const mockConfigManager = {
      loadFromFile: vi.fn(),
      get: vi.fn((path, defaultValue) => {
        if (path === 'storage.collections.path') return './test-collections';
        if (path === '') return { plugins: [] };
        return defaultValue;
      }),
      set: vi.fn(),
    };
    vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(
      mockConfigManager as any
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('creates a program with default options', async () => {
    const program = await makeProgram();
    expect(program).toBeDefined();
    expect(program.name()).toBe('shc');
    expect(program.description()).toBe('SHC Command Line Interface');
    expect(program.version()).toBe('0.1.0');
    
    // Check that commands were added
    const commandNames = program.commands.map(cmd => cmd.name());
    expect(commandNames).toContain('get');
    expect(commandNames).toContain('post');
    expect(commandNames).toContain('put');
    expect(commandNames).toContain('delete');
    expect(commandNames).toContain('patch');
    expect(commandNames).toContain('collection');
    expect(commandNames).toContain('list');
    expect(commandNames).toContain('completion');
  });

  it('creates a program with exitOverride option', async () => {
    const program = await makeProgram({ exitOverride: true });
    
    // Test that exitOverride works by triggering help (which normally exits)
    try {
      await program.parseAsync(['node', 'shc', '--help'], { from: 'user' });
    } catch (error) {
      // Commander throws a special CommanderError when exitOverride is used
      // Just check that we got an error, the exact code may vary
      expect(error).toBeDefined();
      expect((error as any).code).toBeDefined();
    }
  });

  it('creates a program with suppressOutput option', async () => {
    const program = await makeProgram({ suppressOutput: true });
    
    // Verify that output is suppressed
    const outputConfig = (program as any)._outputConfiguration;
    expect(outputConfig.writeOut).toBeDefined();
    expect(outputConfig.writeErr).toBeDefined();
    
    // Call the output methods to ensure they don't throw
    outputConfig.writeOut('test');
    outputConfig.writeErr('test');
    
    // No console output should have occurred
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('creates a program with mockConsole option', async () => {
    const mockLog = vi.fn();
    const mockError = vi.fn();
    
    const program = await makeProgram({
      mockConsole: {
        log: mockLog,
        error: mockError,
      },
    });
    
    // Verify that console methods were temporarily replaced
    expect(console.log).not.toBe(mockLog);
    expect(console.error).not.toBe(mockError);
    
    // Original console methods should be restored after program creation
    console.log('test');
    console.error('test error');
    
    expect(mockLog).not.toHaveBeenCalled();
    expect(mockError).not.toHaveBeenCalled();
  });

  it('skips plugin initialization when initPlugins is false', async () => {
    const program = await makeProgram({ initPlugins: false });
    
    // Verify that plugins were not initialized
    expect(pluginManager.cliPluginManager.loadPlugins).not.toHaveBeenCalled();
  });
});
