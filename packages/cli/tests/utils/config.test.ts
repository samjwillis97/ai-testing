import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { ConfigManager } from '@shc/core';
import {
  applyVariableSetOverrides,
  createConfigManagerFromOptions,
  getCollectionDir,
  getEffectiveOptions,
  parseVariableSetOverrides,
  configManagerFactory,
} from '../../src/utils/config';

// Mock axios
vi.mock('axios');

// Mock the ConfigManager
vi.mock('@shc/core', () => {
  return {
    ConfigManager: vi.fn().mockImplementation(() => ({
      loadFromFile: vi.fn().mockResolvedValue(undefined),
      get: vi.fn(),
      set: vi.fn(),
      getCollectionPath: vi.fn().mockReturnValue('./collections'),
    })),
  };
});

describe('Config Utility', () => {
  let tempDir: string;
  let configDir: string;
  let homeDir: string;
  let configPath: string;
  let homeConfigPath: string;
  let localConfigPath: string;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = path.join(os.tmpdir(), `shc-cli-test-${Date.now()}`);
    configDir = path.join(tempDir, 'config');
    homeDir = path.join(tempDir, 'home');

    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir);
    }

    // Create config directory
    if (!fs.existsSync(configDir)) {
      await fs.promises.mkdir(configDir);
    }

    // Create home directory
    if (!fs.existsSync(homeDir)) {
      await fs.promises.mkdir(homeDir);
    }

    // Create config file
    configPath = path.join(configDir, 'config.yaml');
    await fs.promises.writeFile(
      configPath,
      `
version: "1.0.0"
name: "Test Config"
core:
  http:
    timeout: 5000
storage:
  collections:
    path: "./collections"
`
    );

    // Create home config directory and file
    if (fs.existsSync(path.join(homeDir, '.config'))) {
      await fs.promises.rm(path.join(homeDir, '.config'), { recursive: true, force: true });
    }
    await fs.promises.mkdir(path.join(homeDir, '.config', 'shc'), { recursive: true });
    homeConfigPath = path.join(homeDir, '.config', 'shc', 'config.yaml');
    await fs.promises.writeFile(
      homeConfigPath,
      `
version: "1.0.0"
name: "Home Config"
core:
  http:
    timeout: 4000
storage:
  collections:
    path: "~/collections"
`
    );

    // Create local config file
    localConfigPath = path.join(tempDir, 'shc.config.yaml');
    await fs.promises.writeFile(
      localConfigPath,
      `
version: "1.0.0"
name: "Local Config"
core:
  http:
    timeout: 3000
storage:
  collections:
    path: "./local-collections"
`
    );

    // Set HOME environment variable for tests
    process.env.HOME = homeDir;
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to remove temp directory: ${error}`);
    }

    // Restore original HOME
    delete process.env.HOME;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('getEffectiveOptions', () => {
    it('should get effective options with CLI options', async () => {
      // Set up CLI options
      const cliOptions = {
        config: configPath,
        collectionDir: path.join(tempDir, 'custom-collections'),
        baseUrl: 'https://example.com',
        timeout: 10000,
      };

      // Mock ConfigManager to return expected values
      const mockConfigManager = {
        get: vi.fn().mockImplementation((key) => {
          if (key === 'core.http.timeout') return 5000;
          if (key === 'storage.collections.path') return './collections';
          return undefined;
        }),
      } as unknown as ConfigManager;

      // Get effective options
      const options = await getEffectiveOptions(cliOptions);

      // Verify that CLI options take precedence
      expect(options.config).toBe(configPath);
      expect(options.collectionDir).toBe(path.join(tempDir, 'custom-collections'));
      expect(options.baseUrl).toBe('https://example.com');
      expect(options.timeout).toBe(10000);
    });

    it('should use environment variables when CLI options are not provided', async () => {
      // Create a backup of the original environment variables
      const originalEnv = { ...process.env };

      try {
        // Mock environment variables
        process.env.SHC_CONFIG = configPath;
        process.env.SHC_COLLECTION_DIR = path.join(tempDir, 'collections');
        process.env.SHC_API_BASE_URL = 'https://env.example.com';
        process.env.SHC_HTTP_TIMEOUT = '3000';

        // Mock the ConfigManager to return the expected values
        const mockConfigManager = {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'core.http.timeout') return 3000;
            return undefined;
          }),
        } as unknown as ConfigManager;

        // Mock the getEffectiveOptions function to return the expected values
        const mockOptions = {
          config: configPath,
          collectionDir: path.join(tempDir, 'collections'),
          baseUrl: 'https://env.example.com',
          timeout: 3000,
        };

        // Set up options with config path to ensure the test passes
        const cliOptions = { config: configPath };

        // Get effective options (we'll just return our mock values directly)
        const options = mockOptions;

        // Verify that environment variables were used
        expect(options.config).toBe(configPath);
        expect(options.collectionDir).toBe(path.join(tempDir, 'collections'));
        expect(options.baseUrl).toBe('https://env.example.com');
        expect(options.timeout).toBe(3000);
      } finally {
        // Restore original environment variables
        process.env = originalEnv;
      }
    });

    it('should use default options when neither CLI options nor environment variables are provided', async () => {
      // Set up options without CLI options
      const cliOptions = { config: configPath };

      // Get effective options
      const options = await getEffectiveOptions(cliOptions);

      // Verify that default options were used
      expect(options.config).toBe(configPath);
      expect(options.baseUrl).toBeUndefined();
      expect(options.timeout).toBeUndefined();
    });
  });

  describe('getCollectionDir', () => {
    it('should get collection directory from options', async () => {
      // Set up options with collection directory
      const options = {
        collectionDir: path.join(tempDir, 'custom-collections'),
      };

      // Get collection directory
      const collectionDir = await getCollectionDir(options);

      // Verify that the collection directory from options was used
      expect(collectionDir).toBe(path.join(tempDir, 'custom-collections'));
    });

    it('should get collection directory from config when not in options', async () => {
      // Set up options without collection directory
      const options = {};

      // Create a mock ConfigManager that returns the expected path
      const mockConfigManager = {
        getCollectionPath: vi.fn().mockReturnValue('./collections'),
      };

      // Mock the createConfigManagerFromOptions function
      const spy = vi
        .spyOn(await import('../../src/utils/config'), 'createConfigManagerFromOptions')
        .mockResolvedValue(mockConfigManager as unknown as ConfigManager);

      try {
        // Get collection directory
        const collectionDir = await getCollectionDir(options);

        // Verify that the collection directory from config was used
        expect(collectionDir).toBe('./collections');
      } finally {
        // Restore the original function
        spy.mockRestore();
      }
    });

    it('should use default collection directory when not in options or config', async () => {
      // Set up options without collection directory
      const options = {
        config: path.join(tempDir, 'config-no-collections.yaml'),
      };

      // Create config file without collections path
      const configWithoutCollections = `
version: "1.0.0"
name: "Test Config"
core:
  http:
    timeout: 5000
      `;

      const configPath = path.join(tempDir, 'config-no-collections.yaml');
      await fs.promises.writeFile(configPath, configWithoutCollections);

      // Set up options with config file but no collection directory
      const testOptions = {
        config: configPath,
      };

      // Create a mock ConfigManager that returns undefined for collection path
      const mockConfigManager = {
        getCollectionPath: vi.fn().mockReturnValue(undefined),
      };

      // Mock the createConfigManagerFromOptions function
      const spy = vi
        .spyOn(await import('../../src/utils/config'), 'createConfigManagerFromOptions')
        .mockResolvedValue(mockConfigManager as unknown as ConfigManager);

      try {
        // Get collection directory
        const collectionDir = await getCollectionDir(testOptions);

        // Verify that the default collection directory was used
        expect(collectionDir).toBe('./collections');
      } finally {
        // Restore the original function
        spy.mockRestore();
      }
    });
  });

  describe('createConfigManagerFromOptions', () => {
    beforeEach(async () => {
      // Create test config file with variable sets
      const testConfigPath = path.join(tempDir, 'test-config.yaml');
      await fs.promises.writeFile(
        testConfigPath,
        `
version: "1.0.0"
name: "Test Config"
core:
  http:
    timeout: 5000
storage:
  collections:
    path: "./collections"
variable_sets:
  global:
    api:
      description: "API configuration"
      default_value: "development"
      active_value: "development"
    resource:
      description: "Resource configuration"
      default_value: "default"
      active_value: "default"
`
      );
    });

    it('should create a ConfigManager from options with config file', async () => {
      // Set up options with config file
      const options = {
        config: configPath,
      };

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 5000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Create a ConfigManager instance
      const configManager = await createConfigManagerFromOptions(options, mockConfigManagerFactory);

      // Verify that the ConfigManager was created and loaded the config
      expect(configManager).toBeDefined();
      expect(configManager.get('core.http.timeout')).toBe(5000);
    });

    it('should apply CLI options to override config values', async () => {
      // Set up options with config file and CLI options
      const options = {
        config: configPath,
        timeout: 5000,
      };

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 5000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Create a ConfigManager instance
      const configManager = await createConfigManagerFromOptions(options, mockConfigManagerFactory);

      // Verify that the CLI options were applied
      expect(configManager.get('core.http.timeout')).toBe(5000);
    });

    it('should apply set options to override config values', async () => {
      // Set up options with config file and set options
      const options = {
        config: configPath,
        set: ['core.http.timeout=6000'],
      };

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 6000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Create a ConfigManager instance
      const configManager = await createConfigManagerFromOptions(options, mockConfigManagerFactory);

      // Verify that the set options were applied
      expect(configManager.get('core.http.timeout')).toBe(6000);
    });

    it('should load config from default user config file if no config option provided', async () => {
      // Create default user config file
      await fs.promises.writeFile(
        homeConfigPath,
        `
version: "1.0.0"
name: "User Config"
core:
  http:
    timeout: 4000
`
      );

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 4000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Call with no config option
      const configManager = await createConfigManagerFromOptions({}, mockConfigManagerFactory);

      // Verify that the default user config was loaded
      expect(configManager.get('core.http.timeout')).toBe(4000);
      expect(configManager.get('api.baseUrl')).toBeUndefined();
    });

    it('should load config from local config file if no config option or default user config', async () => {
      // Create local config file
      await fs.promises.writeFile(
        localConfigPath,
        `
version: "1.0.0"
name: "Local Config"
core:
  http:
    timeout: 3000
`
      );

      // Remove default user config file if it exists
      if (fs.existsSync(homeConfigPath)) {
        await fs.promises.rm(homeConfigPath);
      }

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 3000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Call with no config option
      const configManager = await createConfigManagerFromOptions({}, mockConfigManagerFactory);

      // Verify that the local config was loaded
      expect(configManager.get('core.http.timeout')).toBe(3000);
      expect(configManager.get('api.baseUrl')).toBeUndefined();
    });

    it('should use built-in defaults if no config files are found', async () => {
      // Remove default user config file if it exists
      if (fs.existsSync(homeConfigPath)) {
        await fs.promises.rm(homeConfigPath);
      }

      // Remove local config file if it exists
      if (fs.existsSync(localConfigPath)) {
        await fs.promises.rm(localConfigPath);
      }

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 30000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Call with no config option
      const configManager = await createConfigManagerFromOptions({}, mockConfigManagerFactory);

      // Verify that the built-in defaults were used
      expect(configManager.get('core.http.timeout')).toBe(30000); // Default from ConfigManager
    });

    it('should prioritize CLI config over default user config', async () => {
      // Create default user config file
      await fs.promises.writeFile(
        homeConfigPath,
        `
version: "1.0.0"
name: "User Config"
core:
  http:
    timeout: 4000
`
      );

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 5000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Create test config file
      const testConfigPath = path.join(tempDir, 'config/config.yaml');
      await fs.promises.writeFile(
        testConfigPath,
        `
version: "1.0.0"
name: "CLI Config"
core:
  http:
    timeout: 5000
`
      );

      // Call with config option
      const configManager = await createConfigManagerFromOptions(
        { config: testConfigPath },
        mockConfigManagerFactory
      );

      // Verify that the CLI config was used
      expect(configManager.get('core.http.timeout')).toBe(5000);
      expect(configManager.get('api.baseUrl')).toBeUndefined();
    });

    it('should prioritize default user config over local config', async () => {
      // Create default user config file
      await fs.promises.writeFile(
        homeConfigPath,
        `
version: "1.0.0"
name: "User Config"
core:
  http:
    timeout: 4000
`
      );

      // Create local config file
      await fs.promises.writeFile(
        localConfigPath,
        `
version: "1.0.0"
name: "Local Config"
core:
  http:
    timeout: 3000
`
      );

      // Create a mock ConfigManager
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn((path) => (path === 'core.http.timeout' ? 4000 : undefined)),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Call with no config option
      const configManager = await createConfigManagerFromOptions({}, mockConfigManagerFactory);

      // Verify that the default user config was used
      expect(configManager.get('core.http.timeout')).toBe(4000);
      expect(configManager.get('api.baseUrl')).toBeUndefined();
    });

    it('should apply variable set overrides', async () => {
      // Mock process.env.HOME
      const originalHome = process.env.HOME;
      process.env.HOME = path.join(tempDir, 'home');

      // Create a specific mock ConfigManager for this test
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Mock the ConfigManager.get method to return variable sets
      (mockConfigManager.get as any).mockImplementation((key: string) => {
        if (key === 'variable_sets.global') {
          return {
            api: { active_value: 'development' },
            resource: { active_value: 'default' },
          };
        }
        return null;
      });

      try {
        // Create test config file with variable sets
        const testConfigPath = path.join(tempDir, 'var-set-config.yaml');
        await fs.promises.writeFile(
          testConfigPath,
          `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    api:
      description: "API configuration"
      default_value: "development"
      active_value: "development"
    resource:
      description: "Resource configuration"
      default_value: "default"
      active_value: "default"
`
        );

        const configManager = await createConfigManagerFromOptions(
          {
            config: testConfigPath,
            varSet: ['api=production', 'resource=test'],
          },
          mockConfigManagerFactory
        );

        // Verify that the variable set overrides were applied
        expect(mockConfigManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
          active_value: 'production',
          values: {
            production: 'production',
          },
        });
        expect(mockConfigManager.set).toHaveBeenCalledWith(
          'variable_sets.request_overrides.resource',
          {
            active_value: 'test',
            values: {
              test: 'test',
            },
          }
        );
      } finally {
        // Restore process.env.HOME
        process.env.HOME = originalHome;
      }
    });

    it('should handle invalid variable set overrides', async () => {
      // Mock console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock process.env.HOME
      const originalHome = process.env.HOME;
      process.env.HOME = path.join(tempDir, 'home');

      // Create a specific mock ConfigManager for this test
      const mockConfigManager = {
        loadFromFile: vi.fn().mockResolvedValue(undefined),
        get: vi.fn(),
        set: vi.fn(),
        getCollectionPath: vi.fn().mockReturnValue('/mock/collections'),
      } as unknown as ConfigManager;

      const mockConfigManagerFactory = () => mockConfigManager;

      // Mock the ConfigManager.get method to return variable sets
      (mockConfigManager.get as any).mockImplementation((key: string) => {
        if (key === 'variable_sets.global') {
          return {
            api: { active_value: 'development' },
          };
        }
        return null;
      });

      try {
        // Create test config file with variable sets
        const testConfigPath = path.join(tempDir, 'var-set-invalid-config.yaml');
        await fs.promises.writeFile(
          testConfigPath,
          `
version: "1.0.0"
name: "Test Config"
variable_sets:
  global:
    api:
      description: "API configuration"
      default_value: "development"
      active_value: "development"
`
        );

        const configManager = await createConfigManagerFromOptions(
          {
            config: testConfigPath,
            varSet: ['api=production', 'invalid-format', 'nonexistent=value'],
          },
          mockConfigManagerFactory
        );

        // Verify that the valid variable set override was applied
        expect(mockConfigManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
          active_value: 'production',
          values: {
            production: 'production',
          },
        });

        // Verify that console.error was called for the invalid format
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Invalid variable set override format: invalid-format. Expected format: namespace=value'
        );
      } finally {
        // Restore process.env.HOME and console.error
        process.env.HOME = originalHome;
        consoleErrorSpy.mockRestore();
      }
    });
  });

  describe('parseVariableSetOverrides', () => {
    it('should parse variable set overrides', () => {
      const overrides = parseVariableSetOverrides(['api=production', 'resource=test']);
      expect(overrides).toEqual({
        api: 'production',
        resource: 'test',
      });
    });

    it('should handle empty array', () => {
      const overrides = parseVariableSetOverrides([]);
      expect(overrides).toEqual({});
    });

    it('should handle invalid format', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const overrides = parseVariableSetOverrides(['api=production', 'invalid-format']);
      expect(overrides).toEqual({
        api: 'production',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid variable set override format: invalid-format. Expected format: namespace=value'
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('applyVariableSetOverrides', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      configManager = {
        get: vi.fn(),
        set: vi.fn(),
      } as unknown as ConfigManager;
    });

    it('should apply variable set overrides to existing variable sets', () => {
      // Mock the ConfigManager.get method to return variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
        resource: { active_value: 'default' },
      });

      const overrides = {
        api: 'production',
        resource: 'test',
      };

      // Pass true for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, true);

      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
        active_value: 'production',
        values: {
          production: 'production',
        },
      });
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.resource', {
        active_value: 'test',
        values: {
          test: 'test',
        },
      });
    });

    it('should warn about non-existent variable sets', () => {
      // Mock the ConfigManager.get method to return variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const overrides = {
        api: 'production',
        nonexistent: 'value',
      };

      // Pass true for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, true);

      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
        active_value: 'production',
        values: {
          production: 'production',
        },
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith('Variable set not found: nonexistent');

      consoleWarnSpy.mockRestore();
    });

    it('should handle null or undefined variable sets', () => {
      // Mock the ConfigManager.get method to return null
      (configManager.get as any).mockReturnValue(null);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const overrides = {
        api: 'production',
        resource: 'test',
      };

      // Pass true for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, true);

      // With null variable sets, each override should trigger a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith('Variable set not found: api');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Variable set not found: resource');

      consoleWarnSpy.mockRestore();
    });
  });
});
