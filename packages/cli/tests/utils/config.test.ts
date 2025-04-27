/**
 * Tests for config utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { getEffectiveOptions, getCollectionDir, createConfigManagerFromOptions, configManagerFactory } from '../../src/utils/config.js';
import path from 'path';
import os from 'os';

// Mock fs and existsSync
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

// Mock os with default export
vi.mock('os', () => {
  return {
    default: {
      homedir: vi.fn().mockReturnValue('/home/user'),
    },
    homedir: vi.fn().mockReturnValue('/home/user'),
  };
});

// Mock path with default export
vi.mock('path', () => {
  return {
    default: {
      join: vi.fn((...args) => args.join('/')),
      extname: vi.fn((filePath) => {
        const parts = filePath.split('.');
        return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
      }),
    },
    join: vi.fn((...args) => args.join('/')),
    extname: vi.fn((filePath) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }),
  };
});

describe('Config Utilities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getEffectiveOptions', () => {
    it('should return original options merged with config data when no config file is specified', async () => {
      // Create a mock ConfigManager factory
      const mockGet = vi.fn((path, defaultValue) => {
        if (path === 'core') return { http: { timeout: 30000 } };
        if (path === 'storage') return { collections: { path: './collections' } };
        if (path === 'variable_sets') return { global: {} };
        return defaultValue;
      });
      
      const mockConfigManager = {
        loadFromFile: vi.fn(),
        get: mockGet,
        set: vi.fn()
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const options = { verbose: true };
      const result = await getEffectiveOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(result).toHaveProperty('core');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('variable_sets');
      expect(result).toHaveProperty('verbose', true);
    });

    it('should handle config file loading and extract config properties', async () => {
      // Create a mock ConfigManager factory
      const mockGet = vi.fn((path, defaultValue) => {
        if (path === 'core') return { http: { timeout: 30000 } };
        if (path === 'storage') return { collections: { path: './collections' } };
        if (path === 'variable_sets') return { global: {} };
        return defaultValue;
      });
      
      const mockLoadFromFile = vi.fn();
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: mockGet,
        set: vi.fn()
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const configPath = '/path/to/config.yaml';
      const options = { config: configPath };
      
      const result = await getEffectiveOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(mockLoadFromFile).toHaveBeenCalledWith(configPath);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Config loaded from'));
      expect(result).toHaveProperty('core');
      expect(result).toHaveProperty('storage');
      expect(result).toHaveProperty('config', configPath);
    });

    it('should handle config loading errors', async () => {
      // Create a mock ConfigManager factory
      const mockGet = vi.fn((path, defaultValue) => {
        if (path === 'core') return { http: { timeout: 30000 } };
        if (path === 'storage') return { collections: { path: './collections' } };
        if (path === 'variable_sets') return { global: {} };
        return defaultValue;
      });
      
      const mockLoadFromFile = vi.fn().mockRejectedValue(new Error('Failed to load config'));
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: mockGet,
        set: vi.fn()
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const configPath = '/path/to/config.yaml';
      const options = { config: configPath };
      
      const result = await getEffectiveOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalledTimes(2); // Called twice due to error handling
      expect(mockLoadFromFile).toHaveBeenCalledWith(configPath);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load config file'));
      expect(result).toHaveProperty('config', configPath);
    });
  });

  describe('getCollectionDir', () => {
    it('should return collectionDir from options if specified', async () => {
      const options = { collectionDir: '/custom/dir' };
      const result = await getCollectionDir(options);
      
      expect(result).toBe('/custom/dir');
    });

    it('should return path from config if storage.collections.path is defined', async () => {
      const options = {
        storage: {
          collections: {
            path: '/config/collections',
          },
        },
      };
      const result = await getCollectionDir(options);
      
      expect(result).toBe('/config/collections');
    });

    it('should return default path if no custom path is specified', async () => {
      // Setup mocks for this specific test
      const homeDir = '/home/user';
      vi.mocked(os.homedir).mockReturnValue(homeDir);
      vi.mocked(path.join).mockReturnValue(`${homeDir}/.shc/collections`);
      
      const options = {};
      const result = await getCollectionDir(options);
      
      expect(os.homedir).toHaveBeenCalled();
      expect(path.join).toHaveBeenCalled();
      expect(result).toBe('/home/user/.shc/collections');
    });
  });

  describe('createConfigManagerFromOptions', () => {
    it('should create a ConfigManager instance with default settings', async () => {
      // Create a mock ConfigManager factory
      const mockLoadFromFile = vi.fn();
      const mockSet = vi.fn();
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: vi.fn(),
        set: mockSet
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const options = {};
      const configManager = await createConfigManagerFromOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(mockLoadFromFile).not.toHaveBeenCalled();
    });

    it('should load config from file if config path is provided', async () => {
      // Create a mock ConfigManager factory
      const mockLoadFromFile = vi.fn();
      const mockSet = vi.fn();
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: vi.fn(),
        set: mockSet
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const configPath = '/path/to/config.yaml';
      const options = { config: configPath };
      
      const configManager = await createConfigManagerFromOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(mockLoadFromFile).toHaveBeenCalledWith(configPath);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Config loaded from'));
    });

    it('should handle config loading errors', async () => {
      // Create a mock ConfigManager factory
      const mockLoadFromFile = vi.fn().mockRejectedValue(new Error('Failed to load config'));
      const mockSet = vi.fn();
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: vi.fn(),
        set: mockSet
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const configPath = '/path/to/config.yaml';
      const options = { config: configPath };
      
      const configManager = await createConfigManagerFromOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(mockLoadFromFile).toHaveBeenCalledWith(configPath);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Failed to load config file'));
    });

    it('should set CLI options in the config manager', async () => {
      // Create a mock ConfigManager factory
      const mockLoadFromFile = vi.fn();
      const mockSet = vi.fn();
      
      const mockConfigManager = {
        loadFromFile: mockLoadFromFile,
        get: vi.fn(),
        set: mockSet
      };
      
      const mockFactory = vi.fn().mockReturnValue(mockConfigManager);
      
      const options = { 
        collectionDir: '/custom/dir',
        timeout: 5000
      };
      
      const configManager = await createConfigManagerFromOptions(options, mockFactory);
      
      expect(mockFactory).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith('storage.collections.path', '/custom/dir');
      expect(mockSet).toHaveBeenCalledWith('core.http.timeout', 5000);
    });
  });
});
