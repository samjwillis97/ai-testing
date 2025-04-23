import { PluginManager, PluginLoadError } from './PluginManager';
import { 
  PluginType, 
  RequestPreprocessorPlugin, 
  ResponseTransformerPlugin,
  PluginConfig 
} from '../types/plugin';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn((command, callback) => callback(null, { stdout: '', stderr: '' }))
}));

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockPlugin: RequestPreprocessorPlugin;
  let mockImportModule: jest.Mock;

  beforeEach(() => {
    mockPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      type: PluginType.REQUEST_PREPROCESSOR,
      execute: jest.fn()
    };

    mockImportModule = jest.fn().mockResolvedValue({ default: mockPlugin });

    pluginManager = new PluginManager(
      {
        packageManager: 'pnpm',
        pluginsDir: '/tmp/plugins'
      },
      mockImportModule
    );

    jest.clearAllMocks();
  });

  describe('loadPlugin', () => {
    const mockConfig: PluginConfig = {
      name: 'test-plugin',
      package: '@test/plugin',
      version: '1.0.0'
    };

    it('should load a plugin from npm package', async () => {
      const plugin = await pluginManager.loadPlugin(mockConfig);
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe(mockPlugin.name);
      expect(plugin.version).toBe(mockPlugin.version);
      expect(plugin.type).toBe(mockPlugin.type);
      expect(mockImportModule).toHaveBeenCalledWith('@test/plugin');
    });

    it('should call initialize if provided', async () => {
      const initialize = jest.fn();
      mockPlugin.initialize = initialize;

      await pluginManager.loadPlugin(mockConfig);
      expect(initialize).toHaveBeenCalled();
    });

    it('should throw PluginLoadError for invalid plugin', async () => {
      const invalidPlugin = {
        name: 'invalid-plugin'
        // Missing required fields
      };

      mockImportModule.mockResolvedValueOnce({ default: invalidPlugin });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow(PluginLoadError);
    });

    it('should not reload already loaded plugin', async () => {
      // Load plugin first time
      await pluginManager.loadPlugin(mockConfig);
      
      // Change the mock implementation
      const differentPlugin = {
        ...mockPlugin,
        version: '2.0.0'
      };

      mockImportModule.mockResolvedValueOnce({ default: differentPlugin });

      // Load plugin second time
      const plugin = await pluginManager.loadPlugin(mockConfig);
      expect(plugin.version).toBe('1.0.0');
      // Import should only be called once
      expect(mockImportModule).toHaveBeenCalledTimes(1);
    });

    it('should throw when no valid plugin source is specified', async () => {
      const invalidConfig: PluginConfig = {
        name: 'invalid-plugin'
        // No package, path, or git specified
      };

      await expect(pluginManager.loadPlugin(invalidConfig))
        .rejects
        .toThrow('No valid plugin source specified');
    });

    it('should install plugin from local path', async () => {
      const localConfig: PluginConfig = {
        name: 'local-plugin',
        path: './plugins/local'
      };

      await pluginManager.loadPlugin(localConfig);
      expect(mockImportModule).toHaveBeenCalledWith('./plugins/local');
    });

    it('should install plugin from git repository', async () => {
      const gitConfig: PluginConfig = {
        name: 'git-plugin',
        git: 'https://github.com/org/plugin.git',
        ref: 'v1.0.0'
      };

      await pluginManager.loadPlugin(gitConfig);
      expect(mockImportModule).toHaveBeenCalledWith('git-plugin');
    });

    it('should validate plugin type', async () => {
      mockImportModule.mockResolvedValueOnce({
        default: {
          ...mockPlugin,
          type: 'invalid-type'
        }
      });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow('Plugin must have a valid type');
    });

    it('should validate plugin execute function', async () => {
      mockImportModule.mockResolvedValueOnce({
        default: {
          ...mockPlugin,
          execute: 'not-a-function'
        }
      });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow('Plugin must have an execute function');
    });

    it('should validate plugin initialize function if provided', async () => {
      mockImportModule.mockResolvedValueOnce({
        default: {
          ...mockPlugin,
          initialize: 'not-a-function'
        }
      });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow('Plugin initialize must be a function if provided');
    });

    it('should validate plugin destroy function if provided', async () => {
      mockImportModule.mockResolvedValueOnce({
        default: {
          ...mockPlugin,
          destroy: 'not-a-function'
        }
      });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow('Plugin destroy must be a function if provided');
    });
  });

  describe('getPluginsByType', () => {
    it('should return plugins of specified type', async () => {
      const mockPlugins = [
        {
          name: 'plugin1',
          version: '1.0.0',
          type: PluginType.REQUEST_PREPROCESSOR,
          execute: jest.fn()
        } as RequestPreprocessorPlugin,
        {
          name: 'plugin2',
          version: '1.0.0',
          type: PluginType.RESPONSE_TRANSFORMER,
          execute: jest.fn()
        } as ResponseTransformerPlugin,
        {
          name: 'plugin3',
          version: '1.0.0',
          type: PluginType.REQUEST_PREPROCESSOR,
          execute: jest.fn()
        } as RequestPreprocessorPlugin
      ];

      // Set up mock implementations for each plugin
      mockImportModule
        .mockResolvedValueOnce({ default: mockPlugins[0] })
        .mockResolvedValueOnce({ default: mockPlugins[1] })
        .mockResolvedValueOnce({ default: mockPlugins[2] });

      // Load all plugins
      for (const plugin of mockPlugins) {
        await pluginManager.loadPlugin({
          name: plugin.name,
          package: `@test/${plugin.name}`
        });
      }

      const requestPreprocessors = pluginManager.getPluginsByType(PluginType.REQUEST_PREPROCESSOR);
      expect(requestPreprocessors).toHaveLength(2);
      expect(requestPreprocessors.every(p => p.type === PluginType.REQUEST_PREPROCESSOR)).toBe(true);
    });
  });

  describe('unloadPlugin', () => {
    it('should call destroy if provided and remove plugin', async () => {
      const destroy = jest.fn();
      mockPlugin.destroy = destroy;

      await pluginManager.loadPlugin({
        name: 'test-plugin',
        package: '@test/plugin'
      });

      await pluginManager.unloadPlugin('test-plugin');
      
      expect(destroy).toHaveBeenCalled();
      expect(pluginManager.getPlugin('test-plugin')).toBeUndefined();
    });
  });

  describe('unloadAllPlugins', () => {
    it('should unload all plugins', async () => {
      const plugins = [
        { ...mockPlugin, name: 'plugin1' },
        { ...mockPlugin, name: 'plugin2' },
        { ...mockPlugin, name: 'plugin3' }
      ];

      mockImportModule
        .mockResolvedValueOnce({ default: plugins[0] })
        .mockResolvedValueOnce({ default: plugins[1] })
        .mockResolvedValueOnce({ default: plugins[2] });

      // Load all plugins
      for (const plugin of plugins) {
        await pluginManager.loadPlugin({
          name: plugin.name,
          package: `@test/${plugin.name}`
        });
      }

      // Add destroy functions
      const destroyFns = plugins.map(() => jest.fn());
      plugins.forEach((plugin, i) => {
        plugin.destroy = destroyFns[i];
      });

      await pluginManager.unloadAllPlugins();

      // Verify all destroy functions were called
      destroyFns.forEach(destroy => {
        expect(destroy).toHaveBeenCalled();
      });

      // Verify all plugins were removed
      plugins.forEach(plugin => {
        expect(pluginManager.getPlugin(plugin.name)).toBeUndefined();
      });
    });
  });
}); 