import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManagerImpl } from '../../src/services/plugin-manager';
import { SHCPlugin, PluginConfig } from '../../src/types/plugin.types';
import path from 'path';

// Mock external dependencies
vi.mock('pacote', () => ({
  default: {
    extract: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('simple-git', () => {
  const mockGit = {
    clone: vi.fn().mockResolvedValue(undefined),
    checkout: vi.fn().mockResolvedValue(undefined),
  };
  return {
    default: vi.fn().mockReturnValue(mockGit),
  };
});

// Mock fs/promises
vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  rm: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
}));

// Mock ConfigManagerImpl
vi.mock('../../src/config-manager', () => ({
  ConfigManagerImpl: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

// Mock Date.now() to return a consistent value for testing
const mockDateNow = 12345;
vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);

describe('PluginManager Coverage Improvements', () => {
  let pluginManager: PluginManagerImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    pluginManager = new PluginManagerImpl();
    // Mock process.cwd() to return a consistent value
    vi.spyOn(process, 'cwd').mockReturnValue('/home/sam/code/github.com/samjwillis97/ai-testing/take-2');
  });

  describe('isValidPlugin', () => {
    it('should validate a valid plugin', () => {
      // Access the private method using type assertion
      const isValidPlugin = (pluginManager as any).isValidPlugin.bind(pluginManager);
      
      const validPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor',
        execute: () => {},
      };
      
      expect(isValidPlugin(validPlugin)).toBe(true);
    });

    it('should reject an invalid plugin missing required properties', () => {
      // Access the private method using type assertion
      const isValidPlugin = (pluginManager as any).isValidPlugin.bind(pluginManager);
      
      const invalidPlugin1 = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor',
        // Missing execute function
      };
      
      const invalidPlugin2 = {
        name: 'test-plugin',
        version: '1.0.0',
        // Missing type
        execute: () => {},
      };
      
      const invalidPlugin3 = {
        name: 'test-plugin',
        // Missing version
        type: 'request-preprocessor',
        execute: () => {},
      };
      
      const invalidPlugin4 = {
        // Missing name
        version: '1.0.0',
        type: 'request-preprocessor',
        execute: () => {},
      };
      
      expect(isValidPlugin(invalidPlugin1)).toBe(false);
      expect(isValidPlugin(invalidPlugin2)).toBe(false);
      expect(isValidPlugin(invalidPlugin3)).toBe(false);
      expect(isValidPlugin(invalidPlugin4)).toBe(false);
    });

    it('should reject an invalid plugin with wrong property types', () => {
      // Access the private method using type assertion
      const isValidPlugin = (pluginManager as any).isValidPlugin.bind(pluginManager);
      
      const invalidPlugin1 = {
        name: 123, // Should be string
        version: '1.0.0',
        type: 'request-preprocessor',
        execute: () => {},
      };
      
      const invalidPlugin2 = {
        name: 'test-plugin',
        version: 123, // Should be string
        type: 'request-preprocessor',
        execute: () => {},
      };
      
      const invalidPlugin3 = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 123, // Should be string
        execute: () => {},
      };
      
      const invalidPlugin4 = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor',
        execute: 'not-a-function', // Should be function
      };
      
      expect(isValidPlugin(invalidPlugin1)).toBe(false);
      expect(isValidPlugin(invalidPlugin2)).toBe(false);
      expect(isValidPlugin(invalidPlugin3)).toBe(false);
      expect(isValidPlugin(invalidPlugin4)).toBe(false);
    });
  });

  describe('Plugin registration', () => {
    it('should register plugins from config', async () => {
      // Mock the private methods to return a valid plugin
      const mockPlugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };

      // Mock the private methods
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromPackage')
        .mockResolvedValue(mockPlugin);
      
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromLocalPath')
        .mockResolvedValue(mockPlugin);
      
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromGit')
        .mockResolvedValue(mockPlugin);

      // Test npm package config
      const npmConfig: PluginConfig = {
        name: 'test-plugin',
        package: '@test/plugin',
        version: '1.0.0',
      };
      await pluginManager.registerFromConfig(npmConfig);
      expect(pluginManager.getPlugin('test-plugin')).toBeDefined();

      // Reset for next test
      vi.clearAllMocks();
      pluginManager = new PluginManagerImpl();
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromPackage')
        .mockResolvedValue({...mockPlugin, name: 'path-plugin'});
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromLocalPath')
        .mockResolvedValue({...mockPlugin, name: 'path-plugin'});

      // Test local path config
      const pathConfig: PluginConfig = {
        name: 'path-plugin',
        path: './plugins/local-plugin',
      };
      await pluginManager.registerFromConfig(pathConfig);
      expect(pluginManager.getPlugin('path-plugin')).toBeDefined();

      // Reset for next test
      vi.clearAllMocks();
      pluginManager = new PluginManagerImpl();
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromPackage')
        .mockResolvedValue({...mockPlugin, name: 'git-plugin'});
      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromGit')
        .mockResolvedValue({...mockPlugin, name: 'git-plugin'});

      // Test git repo config
      const gitConfig: PluginConfig = {
        name: 'git-plugin',
        git: 'https://github.com/test/plugin.git',
        ref: 'main',
      };
      await pluginManager.registerFromConfig(gitConfig);
      expect(pluginManager.getPlugin('git-plugin')).toBeDefined();

      // Test disabled plugin
      const disabledConfig: PluginConfig = {
        name: 'disabled-plugin',
        package: '@test/disabled-plugin',
        enabled: false,
      };
      await pluginManager.registerFromConfig(disabledConfig);
      expect(pluginManager.getPlugin('disabled-plugin')).toBeUndefined();

      // Test invalid config
      const invalidConfig: PluginConfig = {
        name: 'invalid-plugin',
        // Missing package, path, or git
      } as any;
      await expect(pluginManager.registerFromConfig(invalidConfig)).rejects.toThrow();
    });

    it('should handle plugin configuration', async () => {
      const mockPlugin: SHCPlugin = {
        name: 'config-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        configure: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(PluginManagerImpl.prototype as any, 'loadPluginFromPackage')
        .mockResolvedValue(mockPlugin);

      const config: PluginConfig = {
        name: 'config-plugin',
        package: '@test/config-plugin',
        config: {
          option1: 'value1',
          option2: 'value2',
        },
      };

      await pluginManager.registerFromConfig(config);
      expect(mockPlugin.configure).toHaveBeenCalledWith({
        option1: 'value1',
        option2: 'value2',
      });
    });
  });

  describe('Plugin lifecycle', () => {
    it('should handle plugin initialization errors', async () => {
      const plugin1: SHCPlugin = {
        name: 'error-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
      };

      const plugin2: SHCPlugin = {
        name: 'success-plugin',
        version: '1.0.0',
        type: 'response-transformer' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockResolvedValue(undefined),
      };

      // Spy on eventEmitter.emit
      const emitSpy = vi.spyOn((pluginManager as any).eventEmitter, 'emit');

      pluginManager.register(plugin1);
      pluginManager.register(plugin2);

      await pluginManager.initialize();

      expect(plugin1.initialize).toHaveBeenCalled();
      expect(plugin2.initialize).toHaveBeenCalled();
      expect(pluginManager.isPluginEnabled('error-plugin')).toBe(false);
      expect(pluginManager.isPluginEnabled('success-plugin')).toBe(true);
      expect(emitSpy).toHaveBeenCalledWith('plugin:error', expect.any(Object));
    });

    it('should handle plugin destruction errors', async () => {
      const plugin: SHCPlugin = {
        name: 'error-destroy',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        destroy: vi.fn().mockRejectedValue(new Error('Destroy failed')),
      };

      // Spy on eventEmitter.emit
      const emitSpy = vi.spyOn((pluginManager as any).eventEmitter, 'emit');

      pluginManager.register(plugin);

      await pluginManager.destroy();

      expect(plugin.destroy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('plugin:error', expect.any(Object));
    });
  });
});
