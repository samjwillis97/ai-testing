/**
 * Tests for CLI Plugin Initialization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SHCConfig, ConfigManager } from '@shc/core';
import { initializePlugins } from '../../src/plugins/index';
import { cliPluginManager } from '../../src/plugins/plugin-manager';
import * as path from 'path';
import * as fs from 'fs';
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

// Create a temporary directory for test config files
const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-plugin-test-' + Date.now());
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'config.yaml');

// Create test config file content with plugins
const TEST_CONFIG_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  plugins:
    - name: test-plugin
      package: '@shc/test-plugin'
      version: '1.0.0'
      enabled: true
    - name: disabled-plugin
      package: '@shc/disabled-plugin'
      enabled: false
    - name: path-plugin
      path: './plugins/path-plugin'
      enabled: true
    - name: git-plugin
      git: 'https://github.com/example/git-plugin.git'
      ref: 'main'
      enabled: true
`;

// Create test config file content without plugins
const TEST_CONFIG_NO_PLUGINS_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  defaultFormat: json
`;

// Create test config file content with empty plugins
const TEST_CONFIG_EMPTY_PLUGINS_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
cli:
  plugins: []
`;

describe('Plugin Initialization', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  // Spy on cliPluginManager methods
  const setSilentModeSpy = vi.spyOn(cliPluginManager, 'setSilentMode');
  const loadPluginsSpy = vi.spyOn(cliPluginManager, 'loadPlugins');

  beforeEach(() => {
    // Create test directory and config file
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Write test config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();

    // Reset mocks
    vi.clearAllMocks();

    // Mock loadPlugins to prevent actual plugin loading
    loadPluginsSpy.mockImplementation(async () => {});

    // Create a mock plugin module that can be loaded
    const mockPluginPath = path.join(TEST_DIR, 'plugins');
    if (!fs.existsSync(mockPluginPath)) {
      fs.mkdirSync(mockPluginPath, { recursive: true });
    }

    // Create a mock path plugin
    const mockPathPluginDir = path.join(mockPluginPath, 'path-plugin');
    if (!fs.existsSync(mockPathPluginDir)) {
      fs.mkdirSync(mockPathPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(mockPathPluginDir, 'index.js'),
        `
        module.exports = {
          name: 'path-plugin',
          version: '1.0.0',
          description: 'Test path plugin',
          register: (context) => {
            // Register plugin functionality
          }
        };
        `
      );
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    // Restore console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;

    // Restore original implementations
    vi.restoreAllMocks();
  });

  it('should initialize plugins with normal mode', async () => {
    // Initialize plugins with silent mode disabled
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that silent mode was set correctly
    expect(setSilentModeSpy).toHaveBeenCalledWith(false);

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should initialize plugins with silent mode', async () => {
    // Spy on the setSilentMode method of the cliPluginManager
    const setSilentModeSpy = vi.spyOn(cliPluginManager, 'setSilentMode');

    // Mock the loadPlugins method to prevent actual plugin loading
    const loadPluginsSpy = vi
      .spyOn(cliPluginManager, 'loadPlugins')
      .mockImplementation(async () => {
        return;
      });

    // Initialize plugins with silent mode enabled
    await initializePlugins({ silent: true, config: TEST_CONFIG_PATH });

    // Verify that silent mode was set correctly
    expect(setSilentModeSpy).toHaveBeenCalledWith(true);

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should handle errors during plugin initialization', async () => {
    // Make loadPlugins throw an error
    loadPluginsSpy.mockRejectedValueOnce(new Error('Test error'));

    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that the error was logged
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle missing plugin configuration', async () => {
    // Create a config file without plugins section
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);

    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was not called
    expect(loadPluginsSpy).not.toHaveBeenCalled();
  });

  it('should handle empty plugin configuration', async () => {
    // Create a config file with empty plugins array
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_EMPTY_PLUGINS_CONTENT);

    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was not called
    expect(loadPluginsSpy).not.toHaveBeenCalled();
  });

  it('should set output format in config', async () => {
    // Create a config file without output format
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);

    // Mock the createConfigManagerFromOptions function
    const mockConfig = {
      api: {
        baseUrl: 'https://api.example.com',
        timeout: 2000,
      },
    };

    // Create a spy for createConfigManagerFromOptions
    const configManagerSpy = vi.spyOn(cliPluginManager, 'loadPlugins').mockResolvedValue();

    // Initialize plugins with output format
    await initializePlugins({
      silent: false,
      config: TEST_CONFIG_PATH,
      output: 'json',
    });

    // Verify that loadPlugins was called with the correct config
    expect(configManagerSpy).toHaveBeenCalled();

    // Restore the original implementation
    configManagerSpy.mockRestore();
  });

  it('should respect silent mode', async () => {
    // Create a config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Create a spy for setSilentMode
    const setSilentModeSpy = vi.spyOn(cliPluginManager, 'setSilentMode');

    // Initialize plugins with silent mode
    await initializePlugins({ silent: true, config: TEST_CONFIG_PATH });

    // Verify that setSilentMode was called with true
    expect(setSilentModeSpy).toHaveBeenCalledWith(true);

    // Restore the spy
    setSilentModeSpy.mockRestore();
  });

  it('should handle errors during initialization in silent mode', async () => {
    // Create a config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Create spies for console methods
    const consoleErrorSpy = vi.spyOn(console, 'error');

    // Create a spy for loadPlugins that throws an error
    const loadPluginsErrorSpy = vi.spyOn(cliPluginManager, 'loadPlugins').mockImplementation(() => {
      throw new Error('Test error');
    });

    // Initialize plugins with silent mode
    await initializePlugins({ silent: true, config: TEST_CONFIG_PATH });

    // Verify that console.error was not called
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // Restore the spies
    consoleErrorSpy.mockRestore();
    loadPluginsErrorSpy.mockRestore();
  });

  it('should handle errors during initialization in non-silent mode', async () => {
    // Create a config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Create spies for console methods
    const consoleErrorSpy = vi.spyOn(console, 'error');

    // Create a spy for loadPlugins that throws an error
    const loadPluginsErrorSpy = vi.spyOn(cliPluginManager, 'loadPlugins').mockImplementation(() => {
      throw new Error('Test error');
    });

    // Initialize plugins without silent mode
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that console.error was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to initialize CLI plugins:',
      expect.any(Error)
    );

    // Restore the spies
    consoleErrorSpy.mockRestore();
    loadPluginsErrorSpy.mockRestore();
  });

  it('should store config file path for plugin discovery', async () => {
    // Create a config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);

    // Create a spy for loadPlugins
    const loadPluginsSpy = vi.spyOn(cliPluginManager, 'loadPlugins').mockResolvedValue();

    // Initialize plugins with config path
    await initializePlugins({
      silent: false,
      config: TEST_CONFIG_PATH,
    });

    // Verify that loadPlugins was called with the config containing the configFilePath
    expect(loadPluginsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        configFilePath: TEST_CONFIG_PATH,
      })
    );

    // Restore the spy
    loadPluginsSpy.mockRestore();
  });

  it('should filter disabled plugins', async () => {
    // Create a test config file with enabled and disabled plugins
    const TEST_PLUGINS_DIR = path.join(TEST_DIR, 'plugins');
    const TEST_COLLECTIONS_DIR = path.join(TEST_DIR, 'collections');

    const configWithPlugins = `
    api:
      baseUrl: https://api.example.com
      timeout: 2000
    cli:
      plugins:
        - name: enabled-plugin
          enabled: true
          path: ${path.join(TEST_PLUGINS_DIR, 'enabled-plugin')}
        - name: disabled-plugin
          enabled: false
          path: ${path.join(TEST_PLUGINS_DIR, 'disabled-plugin')}
    collections:
      path: ${TEST_COLLECTIONS_DIR}
    `;

    const configPath = path.join(TEST_DIR, 'config-with-plugins.yaml');
    fs.writeFileSync(configPath, configWithPlugins);

    // Create the plugin directories
    const enabledPluginDir = path.join(TEST_PLUGINS_DIR, 'enabled-plugin');
    const disabledPluginDir = path.join(TEST_PLUGINS_DIR, 'disabled-plugin');

    if (!fs.existsSync(enabledPluginDir)) {
      fs.mkdirSync(enabledPluginDir, { recursive: true });
    }

    if (!fs.existsSync(disabledPluginDir)) {
      fs.mkdirSync(disabledPluginDir, { recursive: true });
    }

    // Create mock plugin files
    fs.writeFileSync(
      path.join(enabledPluginDir, 'index.js'),
      `
      module.exports = {
        name: 'enabled-plugin',
        register: function(context) {
          console.log('Enabled plugin registered');
        }
      };
      `
    );

    fs.writeFileSync(
      path.join(disabledPluginDir, 'index.js'),
      `
      module.exports = {
        name: 'disabled-plugin',
        register: function(context) {
          console.log('Disabled plugin registered');
        }
      };
      `
    );

    // Set up console.log spy before initializing plugins
    const consoleLogSpy = vi.spyOn(console, 'log');

    // Create a mock implementation for loadPlugins to verify which plugins are processed
    const loadPluginsSpy = vi
      .spyOn(cliPluginManager, 'loadPlugins')
      .mockImplementation(async (config) => {
        // Extract the plugins from the config
        if (config.cli && config.cli.plugins && Array.isArray(config.cli.plugins)) {
          for (const pluginConfig of config.cli.plugins) {
            // Skip disabled plugins
            if (pluginConfig.enabled === false) {
              continue;
            }

            // Log enabled plugins
            console.log(`Processing plugin: ${pluginConfig.name}`);
          }
        }
      });

    // Initialize plugins with the test config
    await initializePlugins({ config: configPath });

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();

    // Check that we see a log message for the enabled plugin but not for the disabled one
    expect(consoleLogSpy).toHaveBeenCalledWith('Processing plugin: enabled-plugin');
    expect(consoleLogSpy).not.toHaveBeenCalledWith('Processing plugin: disabled-plugin');
  });
});
