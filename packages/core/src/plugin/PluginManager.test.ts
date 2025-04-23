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

  beforeEach(() => {
    pluginManager = new PluginManager({
      packageManager: 'pnpm',
      pluginsDir: '/tmp/plugins'
    });
    jest.clearAllMocks();
  });

  describe('loadPlugin', () => {
    const mockPlugin: RequestPreprocessorPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      type: PluginType.REQUEST_PREPROCESSOR,
      execute: jest.fn()
    };

    const mockConfig: PluginConfig = {
      name: 'test-plugin',
      package: '@test/plugin',
      version: '1.0.0'
    };

    beforeEach(() => {
      // Mock the import
      jest.mock('@test/plugin', () => ({
        default: mockPlugin
      }), { virtual: true });
    });

    it('should load a plugin from npm package', async () => {
      const plugin = await pluginManager.loadPlugin(mockConfig);
      
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe(mockPlugin.name);
      expect(plugin.version).toBe(mockPlugin.version);
      expect(plugin.type).toBe(mockPlugin.type);
    });

    it('should call initialize if provided', async () => {
      const initializableMockPlugin: RequestPreprocessorPlugin = {
        ...mockPlugin,
        initialize: jest.fn()
      };

      jest.mock('@test/plugin', () => ({
        default: initializableMockPlugin
      }), { virtual: true });

      await pluginManager.loadPlugin(mockConfig);
      expect(initializableMockPlugin.initialize).toHaveBeenCalled();
    });

    it('should throw PluginLoadError for invalid plugin', async () => {
      const invalidPlugin = {
        name: 'invalid-plugin'
        // Missing required fields
      };

      jest.mock('@test/plugin', () => ({
        default: invalidPlugin
      }), { virtual: true });

      await expect(pluginManager.loadPlugin(mockConfig))
        .rejects
        .toThrow(PluginLoadError);
    });

    it('should not reload already loaded plugin', async () => {
      // Load plugin first time
      await pluginManager.loadPlugin(mockConfig);
      
      // Mock a different plugin to ensure we get the cached one
      const differentMockPlugin: RequestPreprocessorPlugin = {
        ...mockPlugin,
        version: '2.0.0'
      };

      jest.mock('@test/plugin', () => ({
        default: differentMockPlugin
      }), { virtual: true });

      // Load plugin second time
      const plugin = await pluginManager.loadPlugin(mockConfig);
      
      expect(plugin.version).toBe('1.0.0');
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

      // Load all plugins
      for (const plugin of mockPlugins) {
        jest.mock(`@test/${plugin.name}`, () => ({
          default: plugin
        }), { virtual: true });

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
      const mockPlugin: RequestPreprocessorPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn(),
        destroy: jest.fn()
      };

      jest.mock('@test/plugin', () => ({
        default: mockPlugin
      }), { virtual: true });

      await pluginManager.loadPlugin({
        name: 'test-plugin',
        package: '@test/plugin'
      });

      await pluginManager.unloadPlugin('test-plugin');
      
      expect(mockPlugin.destroy).toHaveBeenCalled();
      expect(pluginManager.getPlugin('test-plugin')).toBeUndefined();
    });
  });
}); 