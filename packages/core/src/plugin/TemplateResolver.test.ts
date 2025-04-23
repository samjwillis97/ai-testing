import { PluginManager } from './PluginManager';
import { TemplateResolver, TemplateResolutionError } from './TemplateResolver';
import { PluginType, RequestPreprocessorPlugin } from '../types/plugin';

describe('TemplateResolver', () => {
  let pluginManager: PluginManager;
  let templateResolver: TemplateResolver;

  beforeEach(() => {
    pluginManager = new PluginManager({
      packageManager: 'pnpm',
      pluginsDir: '/tmp/plugins'
    });
    templateResolver = new TemplateResolver(pluginManager);
  });

  describe('parseTemplate', () => {
    it('should parse simple function calls', () => {
      const template = 'Hello ${plugin.function()}';
      const calls = templateResolver.parseTemplate(template);
      
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({
        plugin: 'plugin',
        function: 'function',
        arguments: []
      });
    });

    it('should parse function calls with arguments', () => {
      const template = 'Value: ${plugin.function(arg1, arg2)}';
      const calls = templateResolver.parseTemplate(template);
      
      expect(calls).toHaveLength(1);
      expect(calls[0]).toEqual({
        plugin: 'plugin',
        function: 'function',
        arguments: ['arg1', 'arg2']
      });
    });

    it('should parse multiple function calls', () => {
      const template = '${p1.f1()} ${p2.f2(a, b)}';
      const calls = templateResolver.parseTemplate(template);
      
      expect(calls).toHaveLength(2);
      expect(calls[0]).toEqual({
        plugin: 'p1',
        function: 'f1',
        arguments: []
      });
      expect(calls[1]).toEqual({
        plugin: 'p2',
        function: 'f2',
        arguments: ['a', 'b']
      });
    });

    it('should return empty array for templates without function calls', () => {
      const template = 'Hello World';
      const calls = templateResolver.parseTemplate(template);
      expect(calls).toHaveLength(0);
    });
  });

  describe('executeTemplateFunction', () => {
    const mockPlugin: RequestPreprocessorPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      type: PluginType.REQUEST_PREPROCESSOR,
      execute: jest.fn(),
      providedFunctions: {
        greet: {
          name: 'greet',
          description: 'Returns a greeting',
          execute: async () => 'Hello'
        },
        echo: {
          name: 'echo',
          description: 'Returns the input',
          parameters: [
            {
              name: 'input',
              type: 'string',
              description: 'Value to echo',
              required: true
            }
          ],
          execute: async (input: string) => input
        }
      }
    };

    beforeEach(() => {
      jest.spyOn(pluginManager, 'getPlugin').mockImplementation((name) => {
        return name === 'test-plugin' ? mockPlugin : undefined;
      });
    });

    it('should execute function without arguments', async () => {
      const result = await templateResolver.executeTemplateFunction({
        plugin: 'test-plugin',
        function: 'greet',
        arguments: []
      });

      expect(result).toBe('Hello');
    });

    it('should execute function with arguments', async () => {
      const result = await templateResolver.executeTemplateFunction({
        plugin: 'test-plugin',
        function: 'echo',
        arguments: ['test']
      });

      expect(result).toBe('test');
    });

    it('should throw for non-existent plugin', async () => {
      await expect(
        templateResolver.executeTemplateFunction({
          plugin: 'non-existent',
          function: 'test',
          arguments: []
        })
      ).rejects.toThrow(TemplateResolutionError);
    });

    it('should throw for non-existent function', async () => {
      await expect(
        templateResolver.executeTemplateFunction({
          plugin: 'test-plugin',
          function: 'non-existent',
          arguments: []
        })
      ).rejects.toThrow(TemplateResolutionError);
    });

    it('should throw for invalid argument count', async () => {
      await expect(
        templateResolver.executeTemplateFunction({
          plugin: 'test-plugin',
          function: 'echo',
          arguments: []
        })
      ).rejects.toThrow(TemplateResolutionError);
    });
  });

  describe('resolveString', () => {
    beforeEach(() => {
      const mockPlugin: RequestPreprocessorPlugin = {
        name: 'test',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn(),
        providedFunctions: {
          value: {
            name: 'value',
            description: 'Returns a value',
            execute: async () => 'test-value'
          }
        }
      };

      jest.spyOn(pluginManager, 'getPlugin').mockImplementation((name) => {
        return name === 'test' ? mockPlugin : undefined;
      });
    });

    it('should resolve template in string', async () => {
      const result = await templateResolver.resolveString(
        'Value is: ${test.value()}'
      );
      expect(result).toBe('Value is: test-value');
    });

    it('should resolve multiple templates in string', async () => {
      const result = await templateResolver.resolveString(
        '${test.value()} and ${test.value()}'
      );
      expect(result).toBe('test-value and test-value');
    });

    it('should return original string if no templates', async () => {
      const original = 'No templates here';
      const result = await templateResolver.resolveString(original);
      expect(result).toBe(original);
    });
  });

  describe('resolveObject', () => {
    beforeEach(() => {
      const mockPlugin: RequestPreprocessorPlugin = {
        name: 'test',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn(),
        providedFunctions: {
          value: {
            name: 'value',
            description: 'Returns a value',
            execute: async () => 'test-value'
          }
        }
      };

      jest.spyOn(pluginManager, 'getPlugin').mockImplementation((name) => {
        return name === 'test' ? mockPlugin : undefined;
      });
    });

    it('should resolve templates in object properties', async () => {
      const obj = {
        str: 'Value: ${test.value()}',
        num: 42,
        nested: {
          str: '${test.value()}'
        },
        arr: ['${test.value()}', 123]
      };

      const result = await templateResolver.resolveObject(obj);

      expect(result).toEqual({
        str: 'Value: test-value',
        num: 42,
        nested: {
          str: 'test-value'
        },
        arr: ['test-value', 123]
      });
    });

    it('should handle non-object values', async () => {
      expect(await templateResolver.resolveObject(null)).toBeNull();
      expect(await templateResolver.resolveObject(undefined)).toBeUndefined();
      expect(await templateResolver.resolveObject(42)).toBe(42);
      expect(await templateResolver.resolveObject(true)).toBe(true);
    });

    it('should handle arrays', async () => {
      const arr = ['${test.value()}', 123, { str: '${test.value()}' }];
      const result = await templateResolver.resolveObject(arr);

      expect(result).toEqual(['test-value', 123, { str: 'test-value' }]);
    });
  });
}); 