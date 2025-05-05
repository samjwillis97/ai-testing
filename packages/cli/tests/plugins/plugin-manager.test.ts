/**
 * Tests for CLI Plugin Manager
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CLIPluginManager } from '../../src/plugins/plugin-manager.js';
import { CLIPlugin, CLIPluginContext } from '../../src/types/cli-plugin.types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import * as childProcess from 'child_process';

// Mock axios
vi.mock('axios');

// Mock child_process.execSync for git and npm commands
vi.mock('child_process', () => ({
  execSync: vi.fn((command) => {
    if (command.includes('git clone')) {
      return Buffer.from('Successfully cloned repository');
    }
    if (command.includes('npm install') || command.includes('pnpm add')) {
      return Buffer.from('Successfully installed package');
    }
    return Buffer.from('');
  }),
}));

// Create a temporary directory for test plugins
const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-plugin-test-' + Date.now());
const TEST_PLUGIN_DIR = path.join(TEST_DIR, 'plugins');

describe('CLI Plugin Manager', () => {
  let pluginManager: CLIPluginManager;
  let mockConsoleLog: any;
  let mockConsoleError: any;

  // Mock plugin for testing
  const mockPlugin: CLIPlugin = {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin for unit tests',
    register: vi.fn((context: CLIPluginContext) => {
      context.registerCommand('test-command', () => {});
      context.registerOutputFormatter('test-format', () => '');
      context.registerShellCompletion('test-shell', () => []);
      context.registerResponseVisualizer('test-viz', () => {});
    }),
  };

  beforeEach(() => {
    // Create a new plugin manager instance for each test
    pluginManager = new CLIPluginManager();

    // Create test directories
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_PLUGIN_DIR)) {
      fs.mkdirSync(TEST_PLUGIN_DIR, { recursive: true });
    }

    // Create a mock plugin module that can be loaded
    const mockPluginPath = path.join(TEST_PLUGIN_DIR, 'mock-plugin');
    if (!fs.existsSync(mockPluginPath)) {
      fs.mkdirSync(mockPluginPath, { recursive: true });
      fs.writeFileSync(
        path.join(mockPluginPath, 'index.js'),
        `
        module.exports = {
          name: 'mock-plugin',
          version: '1.0.0',
          description: 'Mock plugin for testing',
          register: (context) => {
            // Register plugin functionality
          }
        };
        `
      );
    }

    // Mock console methods
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();

    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Silent Mode', () => {
    it('should set silent mode', () => {
      // Set silent mode
      pluginManager.setSilentMode(true);

      // Verify that silent mode is set
      expect(pluginManager.silent).toBe(true);
    });

    it('should not log messages in silent mode', () => {
      // Set silent mode
      pluginManager.setSilentMode(true);

      // Log a message
      pluginManager.log('Test message');

      // Verify that the message was not logged
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should not log errors in silent mode', () => {
      // Set silent mode
      pluginManager.setSilentMode(true);

      // Log an error
      pluginManager.logError('Test error');

      // Verify that the error was not logged
      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should log messages when not in silent mode', () => {
      // Set silent mode to false
      pluginManager.setSilentMode(false);

      // Log a message
      pluginManager.log('Test message');

      // Verify that the message was logged
      expect(mockConsoleLog).toHaveBeenCalledWith('Test message');
    });

    it('should log errors when not in silent mode', () => {
      // Set silent mode to false
      pluginManager.setSilentMode(false);

      // Log an error
      pluginManager.logError('Test error', new Error('Error details'));

      // Verify that the error was logged
      expect(mockConsoleError).toHaveBeenCalledWith('Test error', new Error('Error details'));
    });
  });

  describe('Plugin Registration', () => {
    it('should register a plugin', () => {
      // Register the plugin
      pluginManager.registerPlugin(mockPlugin);

      // Verify that the plugin's register method was called
      expect(mockPlugin.register).toHaveBeenCalled();
    });

    it('should not register the same plugin twice', () => {
      // Register the plugin
      pluginManager.registerPlugin(mockPlugin);

      // Clear mocks
      vi.clearAllMocks();

      // Register the same plugin again
      pluginManager.registerPlugin(mockPlugin);

      // Verify that the plugin's register method was not called again
      expect(mockPlugin.register).not.toHaveBeenCalled();
    });

    it('should handle plugin registration errors', () => {
      // Create a plugin that throws an error during registration
      const errorPlugin: CLIPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        description: 'Plugin that throws an error',
        register: vi.fn(() => {
          throw new Error('Registration error');
        }),
      };

      // Register the plugin
      pluginManager.registerPlugin(errorPlugin);

      // Verify that the error was logged
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('Output Formatters', () => {
    it('should register and retrieve an output formatter', () => {
      // Create a mock formatter
      const mockFormatter = vi.fn(() => 'formatted output');

      // Register the formatter
      pluginManager.registerOutputFormatter('test-format', mockFormatter);

      // Retrieve the formatter
      const formatter = pluginManager.getOutputFormatter('test-format');

      // Verify that the formatter was registered and retrieved correctly
      expect(formatter).toBe(mockFormatter);
    });

    it('should return undefined for non-existent formatter', () => {
      // Retrieve a non-existent formatter
      const formatter = pluginManager.getOutputFormatter('non-existent');

      // Verify that undefined was returned
      expect(formatter).toBeUndefined();
    });

    it('should get all registered output formatters', () => {
      // Create mock formatters
      const mockFormatter1 = vi.fn(() => 'formatted output 1');
      const mockFormatter2 = vi.fn(() => 'formatted output 2');

      // Register the formatters
      pluginManager.registerOutputFormatter('format1', mockFormatter1);
      pluginManager.registerOutputFormatter('format2', mockFormatter2);

      // Get all formatters
      const formatters = pluginManager.getAllOutputFormatters();

      // Verify that all formatters were returned
      expect(formatters.size).toBe(2);
      expect(formatters.get('format1')).toBe(mockFormatter1);
      expect(formatters.get('format2')).toBe(mockFormatter2);
    });
  });

  describe('Commands', () => {
    it('should register and retrieve a command', () => {
      // Create a mock command handler
      const mockCommandHandler = vi.fn();

      // Register the command
      pluginManager.registerCommand('test-command', mockCommandHandler);

      // Retrieve the command
      const commandHandler = pluginManager.getCommand('test-command');

      // Verify that the command was registered and retrieved correctly
      expect(commandHandler).toBe(mockCommandHandler);
    });

    it('should return undefined for non-existent command', () => {
      // Retrieve a non-existent command
      const commandHandler = pluginManager.getCommand('non-existent');

      // Verify that undefined was returned
      expect(commandHandler).toBeUndefined();
    });

    it('should get all registered commands', () => {
      // Create mock command handlers
      const mockCommandHandler1 = vi.fn();
      const mockCommandHandler2 = vi.fn();

      // Register the commands
      pluginManager.registerCommand('command1', mockCommandHandler1);
      pluginManager.registerCommand('command2', mockCommandHandler2);

      // Get all commands
      const commands = pluginManager.getAllCommands();

      // Verify that all commands were returned
      expect(commands.size).toBe(2);
      expect(commands.get('command1')).toBe(mockCommandHandler1);
      expect(commands.get('command2')).toBe(mockCommandHandler2);
    });
  });

  describe('Shell Completions', () => {
    it('should register and retrieve a shell completion handler', () => {
      // Create a mock completion handler
      const mockCompletionHandler = vi.fn(() => ['completion1', 'completion2']);

      // Register the completion handler
      pluginManager.registerShellCompletion('test-shell', mockCompletionHandler);

      // Retrieve the completion handler
      const completionHandler = pluginManager.getShellCompletion('test-shell');

      // Verify that the completion handler was registered and retrieved correctly
      expect(completionHandler).toBe(mockCompletionHandler);
    });

    it('should return undefined for non-existent shell completion', () => {
      // Retrieve a non-existent completion handler
      const completionHandler = pluginManager.getShellCompletion('non-existent');

      // Verify that undefined was returned
      expect(completionHandler).toBeUndefined();
    });

    it('should get all registered shell completions', () => {
      // Create mock completion handlers
      const mockCompletionHandler1 = vi.fn(() => ['completion1']);
      const mockCompletionHandler2 = vi.fn(() => ['completion2']);

      // Register the completion handlers
      pluginManager.registerShellCompletion('shell1', mockCompletionHandler1);
      pluginManager.registerShellCompletion('shell2', mockCompletionHandler2);

      // Get all completion handlers
      const completions = pluginManager.getAllShellCompletions();

      // Verify that all completion handlers were returned
      expect(completions.size).toBe(2);
      expect(completions.get('shell1')).toBe(mockCompletionHandler1);
      expect(completions.get('shell2')).toBe(mockCompletionHandler2);
    });
  });

  describe('Response Visualizers', () => {
    it('should register and retrieve a response visualizer', () => {
      // Create a mock visualizer
      const mockVisualizer = vi.fn(() => 'visualized output');

      // Register the visualizer
      pluginManager.registerResponseVisualizer('test-viz', mockVisualizer);

      // Retrieve the visualizer
      const visualizer = pluginManager.getResponseVisualizer('test-viz');

      // Verify that the visualizer was registered and retrieved correctly
      expect(visualizer).toBe(mockVisualizer);
    });

    it('should return undefined for non-existent visualizer', () => {
      // Retrieve a non-existent visualizer
      const visualizer = pluginManager.getResponseVisualizer('non-existent');

      // Verify that undefined was returned
      expect(visualizer).toBeUndefined();
    });

    it('should get all registered response visualizers', () => {
      // Create mock visualizers
      const mockVisualizer1 = vi.fn(() => 'visualized output 1');
      const mockVisualizer2 = vi.fn(() => 'visualized output 2');

      // Register the visualizers
      pluginManager.registerResponseVisualizer('viz1', mockVisualizer1);
      pluginManager.registerResponseVisualizer('viz2', mockVisualizer2);

      // Get all visualizers
      const visualizers = pluginManager.getAllResponseVisualizers();

      // Verify that all visualizers were returned
      expect(visualizers.size).toBe(2);
      expect(visualizers.get('viz1')).toBe(mockVisualizer1);
      expect(visualizers.get('viz2')).toBe(mockVisualizer2);
    });
  });
});
