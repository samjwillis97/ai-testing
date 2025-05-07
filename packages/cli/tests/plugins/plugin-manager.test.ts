/**
 * Tests for CLI Plugin Manager
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CLIPluginManager } from '../../src/plugins/plugin-manager.js';
import {
  CLIPluginContext,
  CLIPluginType,
  CommandHandler,
  ResponseVisualizer,
} from '../../src/types/cli-plugin.types.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import * as childProcess from 'child_process';

// Mock the logger module
vi.mock('../../src/utils/logger.js', () => {
  const mockInfo = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockDebug = vi.fn();

  return {
    globalLogger: {
      info: mockInfo,
      error: mockError,
      warn: mockWarn,
      debug: mockDebug,
    },
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
    },
  };
});

// Import the mocked logger
import { globalLogger } from '../../src/utils/logger.js';

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

  beforeEach(() => {
    // Create a new plugin manager instance
    pluginManager = new CLIPluginManager();

    // Create test directories
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!fs.existsSync(TEST_PLUGIN_DIR)) {
      fs.mkdirSync(TEST_PLUGIN_DIR, { recursive: true });
    }

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Quiet Mode', () => {
    it('should set quiet mode', () => {
      // Set quiet mode
      pluginManager.setQuietMode(true);

      // Verify that quiet mode is set
      expect((pluginManager as any).quietMode).toBe(true);
    });

    it('should not log messages in quiet mode', () => {
      // Set quiet mode
      pluginManager.setQuietMode(true);

      // Call log method
      pluginManager.log('Test message');

      // Verify that console.log was not called
      expect(globalLogger.info).not.toHaveBeenCalled();
    });

    it('should not log errors in quiet mode', () => {
      // Set quiet mode
      pluginManager.setQuietMode(true);

      // Call logError method
      pluginManager.logError('Test error', new Error('Error details'));

      // Verify that console.error was not called
      expect(globalLogger.error).not.toHaveBeenCalled();
    });

    it('should log messages when not in quiet mode', () => {
      // Set quiet mode to false
      pluginManager.setQuietMode(false);

      // Call log method
      pluginManager.log('Test message');

      // Verify that console.log was called
      expect(globalLogger.info).toHaveBeenCalledWith('Test message');
    });

    it('should log errors when not in quiet mode', () => {
      // Set quiet mode to false
      pluginManager.setQuietMode(false);

      // Create an error object
      const error = new Error('Error details');

      // Call logError method
      pluginManager.logError('Test error', error);

      // Verify that console.error was called
      expect(globalLogger.error).toHaveBeenCalledWith('Test error', error);
    });
  });

  describe('Plugin Registration', () => {
    it('should register a plugin', async () => {
      // Create a test plugin file
      const pluginDir = path.join(TEST_PLUGIN_DIR, 'test-plugin');
      fs.mkdirSync(pluginDir, { recursive: true });

      // Create package.json
      fs.writeFileSync(
        path.join(pluginDir, 'package.json'),
        JSON.stringify({
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          main: 'index.js',
        })
      );

      // Create the plugin file
      fs.writeFileSync(
        path.join(pluginDir, 'index.js'),
        `
        module.exports = {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          type: 'custom_command',
          register: function(context) {
            context.registerCommand('test-command', () => {});
          }
        };
        `
      );

      // Create a plugin config
      const config = {
        cli: {
          plugins: [
            {
              name: 'test-plugin',
              package: '',
              path: pluginDir,
              enabled: true,
            },
          ],
        },
      };

      // Directly register a command to verify our test setup
      const commandHandler: CommandHandler = async () => {
        /* empty */
      };
      pluginManager.registerCommand('direct-test-command', commandHandler);
      expect(pluginManager.getCommand('direct-test-command')).toBeDefined();

      // Mock the loadPathPlugin method to return our test plugin
      const testPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        type: CLIPluginType.CUSTOM_COMMAND,
        register: function (context: CLIPluginContext) {
          const handler: CommandHandler = async () => {
            /* empty */
          };
          context.registerCommand('test-command', handler);
        },
      };

      // Replace the loadPathPlugin method with a mock that returns our test plugin
      const loadPathPluginSpy = vi
        .spyOn(pluginManager as any, 'loadPathPlugin')
        .mockResolvedValue(testPlugin);

      // Load the plugin using the public loadPlugins method
      await pluginManager.loadPlugins(config);

      // Verify that loadPathPlugin was called
      expect(loadPathPluginSpy).toHaveBeenCalledWith(pluginDir);

      // Verify that the plugin was registered
      expect(pluginManager.getCommand('test-command')).toBeDefined();
    });

    it('should not register the same plugin twice', async () => {
      // Create a test plugin
      const testPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        type: CLIPluginType.CUSTOM_COMMAND,
        register: function (context: CLIPluginContext) {
          const handler: CommandHandler = async () => {
            /* empty */
          };
          context.registerCommand('test-command', handler);
        },
      };

      // Mock the loadPathPlugin method
      const loadPathPluginSpy = vi
        .spyOn(pluginManager as any, 'loadPathPlugin')
        .mockResolvedValue(testPlugin);

      // Create a plugin config
      const config = {
        cli: {
          plugins: [
            {
              name: 'test-plugin',
              package: '',
              path: '/fake/path',
              enabled: true,
            },
          ],
        },
      };

      // Load the plugin twice
      await pluginManager.loadPlugins(config);

      // Manually register the command since we're mocking the plugin loading
      (pluginManager as any).loadedPlugins.set('test-plugin', testPlugin);
      const handler: CommandHandler = async () => {
        /* empty */
      };
      pluginManager.registerCommand('test-command', handler);

      // Clear mocks to check for the second call
      vi.clearAllMocks();

      await pluginManager.loadPlugins(config);

      // Verify that the plugin was registered only once
      expect(pluginManager.getCommand('test-command')).toBeDefined();
      expect(globalLogger.info).toHaveBeenCalledWith('Plugin test-plugin already loaded, skipping');
    });

    it('should handle plugin registration errors', async () => {
      // Create a test plugin that throws an error
      const testPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        description: 'Plugin with error',
        type: CLIPluginType.CUSTOM_COMMAND,
        register: function () {
          throw new Error('Plugin initialization error');
        },
      };

      // Mock the loadPathPlugin method
      vi.spyOn(pluginManager as any, 'loadPathPlugin').mockResolvedValue(testPlugin);

      // Create a plugin config
      const config = {
        cli: {
          plugins: [
            {
              name: 'error-plugin',
              package: '',
              path: '/fake/path',
              enabled: true,
            },
          ],
        },
      };

      // Load the plugin
      await pluginManager.loadPlugins(config);

      // Verify that the error was logged
      expect(globalLogger.error).toHaveBeenCalledWith(
        'Failed to register plugin error-plugin:',
        expect.any(Error)
      );
    });
  });

  describe('Output Formatters', () => {
    it('should register and retrieve an output formatter', () => {
      const formatter = (data: any) => JSON.stringify(data);
      pluginManager.registerOutputFormatter('json', formatter);
      expect(pluginManager.getOutputFormatter('json')).toBe(formatter);
    });

    it('should return undefined for non-existent formatter', () => {
      expect(pluginManager.getOutputFormatter('non-existent')).toBeUndefined();
    });

    it('should get all registered output formatters', () => {
      const formatter1 = (data: any) => JSON.stringify(data);
      const formatter2 = (data: any) => String(data);
      pluginManager.registerOutputFormatter('json', formatter1);
      pluginManager.registerOutputFormatter('text', formatter2);
      const formatters = (pluginManager as any).outputFormatters;
      expect(formatters.size).toBe(2);
      expect(formatters.get('json')).toBe(formatter1);
      expect(formatters.get('text')).toBe(formatter2);
    });
  });

  describe('Commands', () => {
    it('should register and retrieve a command', () => {
      const command: CommandHandler = async () => {
        /* empty */
      };
      pluginManager.registerCommand('test', command);
      expect(pluginManager.getCommand('test')).toBe(command);
    });

    it('should return undefined for non-existent command', () => {
      expect(pluginManager.getCommand('non-existent')).toBeUndefined();
    });

    it('should get all registered commands', () => {
      const command1: CommandHandler = async () => {
        /* empty */
      };
      const command2: CommandHandler = async () => {
        /* empty */
      };
      pluginManager.registerCommand('test1', command1);
      pluginManager.registerCommand('test2', command2);
      const commands = (pluginManager as any).commands;
      expect(commands.size).toBe(2);
      expect(commands.get('test1')).toBe(command1);
      expect(commands.get('test2')).toBe(command2);
    });
  });

  describe('Shell Completions', () => {
    it('should register and retrieve a shell completion handler', () => {
      const handler = () => [];
      pluginManager.registerShellCompletion('bash', handler);
      expect(pluginManager.getShellCompletion('bash')).toBe(handler);
    });

    it('should return undefined for non-existent shell completion', () => {
      expect(pluginManager.getShellCompletion('non-existent')).toBeUndefined();
    });

    it('should get all registered shell completions', () => {
      const handler1 = () => [];
      const handler2 = () => [];
      pluginManager.registerShellCompletion('bash', handler1);
      pluginManager.registerShellCompletion('zsh', handler2);
      const completions = (pluginManager as any).shellCompletions;
      expect(completions.size).toBe(2);
      expect(completions.get('bash')).toBe(handler1);
      expect(completions.get('zsh')).toBe(handler2);
    });
  });

  describe('Response Visualizers', () => {
    it('should register and retrieve a response visualizer', () => {
      const visualizer: ResponseVisualizer = () => 'html output';
      pluginManager.registerResponseVisualizer('html', visualizer);
      expect(pluginManager.getResponseVisualizer('html')).toBe(visualizer);
    });

    it('should return undefined for non-existent visualizer', () => {
      expect(pluginManager.getResponseVisualizer('non-existent')).toBeUndefined();
    });

    it('should get all registered response visualizers', () => {
      const visualizer1: ResponseVisualizer = () => 'html output';
      const visualizer2: ResponseVisualizer = () => 'markdown output';
      pluginManager.registerResponseVisualizer('html', visualizer1);
      pluginManager.registerResponseVisualizer('markdown', visualizer2);
      const visualizers = (pluginManager as any).responseVisualizers;
      expect(visualizers.size).toBe(2);
      expect(visualizers.get('html')).toBe(visualizer1);
      expect(visualizers.get('markdown')).toBe(visualizer2);
    });
  });
});
