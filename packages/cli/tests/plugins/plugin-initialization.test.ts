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
  // Create mock functions that can be accessed in tests
  const mockInfo = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockDebug = vi.fn();
  const mockIsQuietMode = vi.fn().mockReturnValue(false);
  const mockConfigure = vi.fn();

  const mockLogger = {
    info: mockInfo,
    error: mockError,
    warn: mockWarn,
    debug: mockDebug,
    isQuietMode: mockIsQuietMode,
    configure: mockConfigure,
    child: vi.fn().mockReturnValue({
      info: mockInfo,
      error: mockError,
      warn: mockWarn,
      debug: mockDebug,
    }),
  };

  // Reset all mocks before each test
  beforeEach(() => {
    mockInfo.mockClear();
    mockError.mockClear();
    mockWarn.mockClear();
    mockDebug.mockClear();
    mockIsQuietMode.mockClear();
    mockConfigure.mockClear();
    mockIsQuietMode.mockReturnValue(false);
  });

  // Create a global reference to access these mocks in tests
  global.__loggerMocks = {
    info: mockInfo,
    error: mockError,
    warn: mockWarn,
    debug: mockDebug,
    isQuietMode: mockIsQuietMode,
    configure: mockConfigure,
  };

  return {
    Logger: {
      getInstance: vi.fn().mockReturnValue(mockLogger),
      createTestInstance: vi.fn().mockReturnValue(mockLogger),
      fromCommandOptions: vi.fn().mockReturnValue(mockLogger),
    },
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
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
import { Logger } from '../../src/utils/logger.js';
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
  let setQuietModeSpy: any;
  let loadPluginsSpy: any;

  beforeEach(() => {
    // Create test directories
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Write test config file
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);

    // Spy on the setQuietMode method of the cliPluginManager
    setQuietModeSpy = vi.spyOn(cliPluginManager, 'setQuietMode');

    // Mock the loadPlugins method to prevent actual plugin loading
    loadPluginsSpy = vi.spyOn(cliPluginManager, 'loadPlugins').mockImplementation(async () => {
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
    // Initialize plugins with quiet mode disabled
    await initializePlugins({ quiet: false, config: TEST_CONFIG_PATH });

    // Verify that silent mode was set correctly
    expect(setQuietModeSpy).toHaveBeenCalledWith(false);

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should initialize plugins with quiet mode', async () => {
    // Initialize plugins with quiet mode enabled
    await initializePlugins({ quiet: true, config: TEST_CONFIG_PATH });

    // Verify that silent mode was set correctly
    expect(setQuietModeSpy).toHaveBeenCalledWith(true);

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should handle errors during plugin initialization', async () => {
    // Create a test error
    const testError = new Error('Test error');
    
    // Create a direct mock for the error method
    const errorSpy = vi.fn();
    
    // Override the Logger.getInstance to return our mock
    const originalGetInstance = Logger.getInstance;
    Logger.getInstance = vi.fn().mockReturnValue({
      error: errorSpy,
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      isQuietMode: vi.fn().mockReturnValue(false),
      configure: vi.fn(),
    });
    
    // Make loadPlugins throw an error
    loadPluginsSpy.mockRejectedValueOnce(testError);

    try {
      // Initialize plugins
      await initializePlugins({ quiet: false, config: TEST_CONFIG_PATH });
  
      // Verify that the error was logged using the logger
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to initialize CLI plugins:',
        testError
      );
    } finally {
      // Restore the original getInstance method
      Logger.getInstance = originalGetInstance;
    }
  });

  it('should handle missing plugin configuration', async () => {
    // Create a config file without plugins section
    fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_NO_PLUGINS_CONTENT);

    // Initialize plugins
    await initializePlugins({ quiet: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was called
    expect(loadPluginsSpy).toHaveBeenCalled();
  });

  it('should suppress errors in quiet mode', async () => {
    // Create a test error
    const testError = new Error('Test error');
    
    // Make loadPlugins throw an error
    loadPluginsSpy.mockRejectedValueOnce(testError);

    // Initialize plugins with quiet mode
    await initializePlugins({ quiet: true, config: TEST_CONFIG_PATH });

    // Verify that the error was not logged
    // Access the mock directly from the global reference
    expect((global as any).__loggerMocks.error).not.toHaveBeenCalled();
  });

  it('should pass the config file path to plugins', async () => {
    // Initialize plugins with a config file path
    await initializePlugins({ quiet: false, config: TEST_CONFIG_PATH });

    // Verify that loadPlugins was called with the config containing the file path
    expect(loadPluginsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        cli: expect.any(Object),
        configFilePath: TEST_CONFIG_PATH,
      })
    );
  });

  it('should handle config manager creation errors', async () => {
    // Create a test error
    const configError = new Error('Config error');
    
    // Create a direct mock for the error method
    const errorSpy = vi.fn();
    
    // Override the Logger.getInstance to return our mock
    const originalGetInstance = Logger.getInstance;
    Logger.getInstance = vi.fn().mockReturnValue({
      error: errorSpy,
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      isQuietMode: vi.fn().mockReturnValue(false),
      configure: vi.fn(),
    });
    
    // Mock createConfigManagerFromOptions to throw an error
    (createConfigManagerFromOptions as any).mockRejectedValueOnce(configError);

    try {
      // Initialize plugins
      await initializePlugins({ quiet: false, config: TEST_CONFIG_PATH });
  
      // Verify that the error was logged
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to initialize CLI plugins:',
        configError
      );
    } finally {
      // Restore the original getInstance method
      Logger.getInstance = originalGetInstance;
    }
  });
});
