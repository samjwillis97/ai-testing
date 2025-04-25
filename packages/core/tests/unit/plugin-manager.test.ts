import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManagerImpl } from '../../src/services/plugin-manager';
import { SHCPlugin, PluginConfig } from '../../src/types/plugin.types';

// Mock ConfigManagerImpl
vi.mock('../../src/config-manager', () => ({
  ConfigManagerImpl: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

describe('PluginManager', () => {
  let pluginManager: PluginManagerImpl;
  
  beforeEach(() => {
    vi.clearAllMocks();
    pluginManager = new PluginManagerImpl();
  });
  
  describe('Plugin registration', () => {
    it('should register a plugin', () => {
      const plugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      pluginManager.register(plugin);
      
      expect(pluginManager.getPlugin('test-plugin')).toEqual(plugin);
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(true);
    });
    
    it('should throw an error when registering a plugin without a name', () => {
      const plugin: SHCPlugin = {
        name: '',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      expect(() => pluginManager.register(plugin)).toThrow('Plugin must have a name');
    });
    
    it('should throw an error when registering a plugin with a duplicate name', () => {
      const plugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      pluginManager.register(plugin);
      
      expect(() => pluginManager.register(plugin)).toThrow('Plugin with name test-plugin is already registered');
    });
    
    it('should register a plugin from config', async () => {
      // Mock the loadPluginFromPackage method
      const mockPlugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        configure: vi.fn(),
      };
      
      // Use a spy to replace the private method
      const loadPluginSpy = vi.spyOn(pluginManager as any, 'loadPluginFromPackage').mockResolvedValue(mockPlugin);
      
      const config: PluginConfig = {
        name: 'test-plugin',
        package: '@test/plugin',
        version: '1.0.0',
        config: {
          option1: 'value1',
        },
      };
      
      await pluginManager.registerFromConfig(config);
      
      expect(loadPluginSpy).toHaveBeenCalledWith('@test/plugin', '1.0.0');
      expect(mockPlugin.configure).toHaveBeenCalledWith({ option1: 'value1' });
      expect(pluginManager.getPlugin('test-plugin')).toEqual(mockPlugin);
    });
    
    it('should not register a disabled plugin', async () => {
      const config: PluginConfig = {
        name: 'test-plugin',
        package: '@test/plugin',
        enabled: false,
      };
      
      await pluginManager.registerFromConfig(config);
      
      expect(pluginManager.getPlugin('test-plugin')).toBeUndefined();
    });
  });
  
  describe('Plugin lifecycle', () => {
    it('should initialize all enabled plugins', async () => {
      const plugin1: SHCPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockResolvedValue(undefined),
      };
      
      const plugin2: SHCPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'response-transformer' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockResolvedValue(undefined),
      };
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      await pluginManager.initialize();
      
      expect(plugin1.initialize).toHaveBeenCalled();
      expect(plugin2.initialize).toHaveBeenCalled();
    });
    
    it('should destroy all enabled plugins', async () => {
      const plugin1: SHCPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      
      const plugin2: SHCPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'response-transformer' as any,
        execute: async () => ({ success: true }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      await pluginManager.destroy();
      
      expect(plugin1.destroy).toHaveBeenCalled();
      expect(plugin2.destroy).toHaveBeenCalled();
    });
    
    it('should continue initialization even if one plugin fails', async () => {
      const plugin1: SHCPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
      };
      
      const plugin2: SHCPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'response-transformer' as any,
        execute: async () => ({ success: true }),
        initialize: vi.fn().mockResolvedValue(undefined),
      };
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      await pluginManager.initialize();
      
      expect(plugin1.initialize).toHaveBeenCalled();
      expect(plugin2.initialize).toHaveBeenCalled();
      expect(pluginManager.isPluginEnabled('plugin1')).toBe(false);
      expect(pluginManager.isPluginEnabled('plugin2')).toBe(true);
    });
  });
  
  describe('Plugin utilities', () => {
    it('should get a plugin by name', () => {
      const plugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      pluginManager.register(plugin);
      
      expect(pluginManager.getPlugin('test-plugin')).toEqual(plugin);
      expect(pluginManager.getPlugin('non-existent')).toBeUndefined();
    });
    
    it('should list all enabled plugins', () => {
      const plugin1: SHCPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      const plugin2: SHCPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        type: 'response-transformer' as any,
        execute: async () => ({ success: true }),
      };
      
      pluginManager.register(plugin1);
      pluginManager.register(plugin2);
      
      // Manually disable plugin2 by accessing private property
      (pluginManager as any).enabledPlugins.delete('plugin2');
      
      const plugins = pluginManager.listPlugins();
      
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toEqual(plugin1);
    });
    
    it('should check if a plugin is enabled', () => {
      const plugin: SHCPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      pluginManager.register(plugin);
      
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(true);
      expect(pluginManager.isPluginEnabled('non-existent')).toBe(false);
      
      // Manually disable the plugin by accessing private property
      (pluginManager as any).enabledPlugins.delete('test-plugin');
      
      expect(pluginManager.isPluginEnabled('test-plugin')).toBe(false);
    });
  });
  
  describe('Dynamic loading', () => {
    it('should load a plugin from npm', async () => {
      // Mock the loadPluginFromPackage method
      const mockPlugin: SHCPlugin = {
        name: 'npm-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      const loadPluginSpy = vi.spyOn(pluginManager as any, 'loadPluginFromPackage').mockResolvedValue(mockPlugin);
      
      await pluginManager.loadFromNpm('@test/plugin', '1.0.0');
      
      expect(loadPluginSpy).toHaveBeenCalledWith('@test/plugin', '1.0.0');
      expect(pluginManager.getPlugin('npm-plugin')).toEqual(mockPlugin);
    });
    
    it('should load a plugin from a local path', async () => {
      // Mock the loadPluginFromLocalPath method
      const mockPlugin: SHCPlugin = {
        name: 'local-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      const loadPluginSpy = vi.spyOn(pluginManager as any, 'loadPluginFromLocalPath').mockResolvedValue(mockPlugin);
      
      await pluginManager.loadFromPath('./plugins/local-plugin');
      
      expect(loadPluginSpy).toHaveBeenCalledWith('./plugins/local-plugin');
      expect(pluginManager.getPlugin('local-plugin')).toEqual(mockPlugin);
    });
    
    it('should load a plugin from git', async () => {
      // Mock the loadPluginFromGit method
      const mockPlugin: SHCPlugin = {
        name: 'git-plugin',
        version: '1.0.0',
        type: 'request-preprocessor' as any,
        execute: async () => ({ success: true }),
      };
      
      const loadPluginSpy = vi.spyOn(pluginManager as any, 'loadPluginFromGit').mockResolvedValue(mockPlugin);
      
      await pluginManager.loadFromGit('https://github.com/org/plugin.git', 'main');
      
      expect(loadPluginSpy).toHaveBeenCalledWith('https://github.com/org/plugin.git', 'main');
      expect(pluginManager.getPlugin('git-plugin')).toEqual(mockPlugin);
    });
  });
});
