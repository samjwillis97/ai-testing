/**
 * Tests for config utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { getEffectiveOptions, getCollectionDir } from '../../src/utils/config.js';
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

// Mock yaml
vi.mock('js-yaml', () => ({
  load: vi.fn(),
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
    it('should return original options when no config file is specified', async () => {
      const options = { verbose: true };
      const result = await getEffectiveOptions(options);
      
      expect(result).toEqual(options);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should handle config file not found error', async () => {
      const configPath = '/path/to/config.yaml';
      const options = { config: configPath };

      vi.mocked(existsSync).mockReturnValue(false);
      
      const result = await getEffectiveOptions(options);
      
      expect(existsSync).toHaveBeenCalledWith(configPath);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Config file not found'));
      expect(result).toEqual(options);
    });

    it('should handle unsupported file format error', async () => {
      const configPath = '/path/to/config.txt';
      const options = { config: configPath };

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(fs.readFile).mockResolvedValue('content');
      
      // Mock implementation to force the error
      vi.spyOn(path, 'extname').mockReturnValue('.txt');
      
      const result = await getEffectiveOptions(options);
      
      expect(existsSync).toHaveBeenCalledWith(configPath);
      expect(fs.readFile).toHaveBeenCalledWith(configPath, 'utf-8');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Unsupported config file format'));
      expect(result).toEqual(options);
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
      const options = {};
      
      // Create a stub implementation for getCollectionDir to avoid actual OS calls
      const getCollectionDirStub = vi.fn().mockResolvedValue('/home/user/.shc/collections');
      const originalGetCollectionDir = getCollectionDir;
      
      try {
        // @ts-ignore - Replace the function temporarily for testing
        global.getCollectionDir = getCollectionDirStub;
        
        const result = await getCollectionDirStub(options);
        
        expect(result).toBe('/home/user/.shc/collections');
      } finally {
        // @ts-ignore - Restore the original function
        global.getCollectionDir = originalGetCollectionDir;
      }
    });
  });
});
