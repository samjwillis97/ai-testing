/**
 * Tests for CLI Plugin Initialization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
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
    Logger: {
      fromCommandOptions: vi.fn(() => ({
        info: mockInfo,
        error: mockError,
        warn: mockWarn,
        debug: mockDebug,
      })),
    },
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      SILENT: 'silent'
    },
  };
});

// Mock the ConfigManager
vi.mock('@shc/core', () => {
  const mockConfigManager = {
    loadFromFile: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
    delete: vi.fn(),
    toJSON: vi.fn(),
    resolveTemplate: vi.fn(),
  };

  return {
    ConfigManager: vi.fn(() => mockConfigManager),
    SHCConfig: vi.fn(),
  };
});

// Mock the utils/config.js module
vi.mock('../../src/utils/config.js', () => {
  return {
    createConfigManagerFromOptions: vi.fn(async () => {
      return {
        get: vi.fn(() => ({
          cli: {
            plugins: [
              {
                name: 'test-plugin',
                package: '@shc/test-plugin',
                version: '1.0.0',
                enabled: true,
              },
              {
                name: 'disabled-plugin',
                package: '@shc/disabled-plugin',
                enabled: false,
              },
              {
                name: 'path-plugin',
                path: './plugins/path-plugin',
                enabled: true,
              },
              {
                name: 'git-plugin',
                git: 'https://github.com/example/git-plugin.git',
                ref: 'main',
                enabled: true,
              },
            ],
          },
        })),
      };
    }),
  };
});

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

// Mock axios
vi.mock('axios');

// Import modules after mocking
import { initializePlugins } from '../../src/plugins/index';
import { cliPluginManager } from '../../src/plugins/plugin-manager';
import { globalLogger } from '../../src/utils/logger.js';
import { createConfigManagerFromOptions } from '../../src/utils/config.js';

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
`;

describe('Plugin Initialization', () => {
  let setSilentModeSpy: any;
  let loadPluginsSpy: any;

  beforeEach(() => {
    // Create test directories
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Write test config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Spy on the setSilentMode method of the cliPluginManager
    setSilentModeSpy = vi.spyOn(cliPluginManager, 'setSilentMode');

    // Mock the loadPlugins method to prevent actual plugin loading
    loadPluginsSpy = vi
      .spyOn(cliPluginManager, 'loadPlugins')
      .mockImplementation(async () => {
        return;
      });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up test directories
    try {
      if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore directory removal errors in tests
      console.warn('Failed to clean up test directory:', error);
    }

    // Restore mocks
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

    // Verify that the error was logged using the logger
    expect(globalLogger.error).toHaveBeenCalledWith(
      'Failed to initialize CLI plugins:',
      expect.any(Error)
    );
  });

  it('should handle missing plugin configuration', async () => {
    // Create a config file without plugins section
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);

    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should suppress errors in silent mode', async () => {
    // Make loadPlugins throw an error
    loadPluginsSpy.mockRejectedValueOnce(new Error('Test error'));

    // Initialize plugins with silent mode
    await initializePlugins({ silent: true, config: TEST_CONFIG_PATH });

    // Verify that the error was not logged
    expect(globalLogger.error).not.toHaveBeenCalled();
  });

  it('should pass the config file path to plugins', async () => {
    // Initialize plugins with a config file path
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was called with the config containing the file path
    expect(loadPluginsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cli: expect.any(Object),
        configFilePath: TEST_CONFIG_PATH,
      })
    );
  });

  it('should handle config manager creation errors', async () => {
    // Mock createConfigManagerFromOptions to throw an error
    (createConfigManagerFromOptions as any).mockRejectedValueOnce(new Error('Config error'));

    // Initialize plugins
    await initializePlugins({ silent: false, config: TEST_CONFIG_PATH });

    // Verify that the error was logged
    expect(globalLogger.error).toHaveBeenCalledWith(
      'Failed to initialize CLI plugins:',
      expect.any(Error)
    );
  });
});
