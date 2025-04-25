import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateEngine, createTemplateEngine } from '../../src/services/template-engine';
import { TemplateFunction } from '../../src/types/config.types';

describe('TemplateEngine', () => {
  let templateEngine: TemplateEngine;

  beforeEach(() => {
    templateEngine = createTemplateEngine();
  });

  describe('registerFunction', () => {
    it('should register a template function', () => {
      const func: TemplateFunction = {
        name: 'testFunc',
        description: 'A test function',
        execute: async () => 'test result'
      };

      templateEngine.registerFunction('test', func);
      
      const registeredFunc = templateEngine.getFunction('test.testFunc');
      expect(registeredFunc).toBe(func);
    });

    it('should list registered functions', () => {
      const func1: TemplateFunction = {
        name: 'func1',
        description: 'Function 1',
        execute: async () => 'result 1'
      };

      const func2: TemplateFunction = {
        name: 'func2',
        description: 'Function 2',
        execute: async () => 'result 2'
      };

      templateEngine.registerFunction('test', func1);
      templateEngine.registerFunction('test', func2);
      
      const functions = templateEngine.listFunctions();
      expect(functions).toContain('test.func1');
      expect(functions).toContain('test.func2');
      expect(functions.length).toBe(2);
    });
  });

  describe('resolve', () => {
    it('should resolve environment variables', async () => {
      const context = {
        env: {
          TEST_VAR: 'test value'
        }
      };

      const result = await templateEngine.resolve('Value: ${env.TEST_VAR}', context);
      expect(result).toBe('Value: test value');
    });

    it('should resolve config values', async () => {
      const context = {
        config: {
          app: {
            name: 'Test App',
            version: '1.0.0'
          }
        }
      };

      const result = await templateEngine.resolve('App: ${config.app.name} v${config.app.version}', context);
      expect(result).toBe('App: Test App v1.0.0');
    });

    it('should resolve variables', async () => {
      const context = {
        variables: {
          user: {
            name: 'John',
            email: 'john@example.com'
          }
        }
      };

      const result = await templateEngine.resolve('User: ${variables.user.name} (${variables.user.email})', context);
      expect(result).toBe('User: John (john@example.com)');
    });

    it('should resolve secrets', async () => {
      const context = {
        secrets: {
          API_KEY: 'secret-api-key'
        }
      };

      const result = await templateEngine.resolve('Key: ${secrets.API_KEY}', context);
      expect(result).toBe('Key: secret-api-key');
    });

    it('should resolve template functions', async () => {
      const uppercase: TemplateFunction = {
        name: 'uppercase',
        description: 'Convert string to uppercase',
        parameters: [
          {
            name: 'text',
            type: 'string',
            description: 'Text to convert',
            required: true
          }
        ],
        execute: async (text: string) => text.toUpperCase()
      };

      const concat: TemplateFunction = {
        name: 'concat',
        description: 'Concatenate strings',
        parameters: [
          {
            name: 'a',
            type: 'string',
            description: 'First string',
            required: true
          },
          {
            name: 'b',
            type: 'string',
            description: 'Second string',
            required: true
          }
        ],
        execute: async (a: string, b: string) => `${a}${b}`
      };

      templateEngine.registerFunction('string', uppercase);
      templateEngine.registerFunction('string', concat);

      const result = await templateEngine.resolve('Result: ${string.uppercase("hello")} ${string.concat("world", "!")}');
      expect(result).toBe('Result: HELLO world!');
    });

    it('should handle errors in template functions', async () => {
      const errorFunc: TemplateFunction = {
        name: 'error',
        description: 'A function that throws an error',
        execute: async () => {
          throw new Error('Test error');
        }
      };

      templateEngine.registerFunction('test', errorFunc);

      const result = await templateEngine.resolve('Result: ${test.error()}');
      expect(result).toContain('Result: [Error: Test error]');
    });

    it('should handle nested template functions', async () => {
      const double: TemplateFunction = {
        name: 'double',
        description: 'Double a number',
        parameters: [
          {
            name: 'num',
            type: 'number',
            description: 'Number to double',
            required: true
          }
        ],
        execute: async (num: number) => num * 2
      };

      const add: TemplateFunction = {
        name: 'add',
        description: 'Add two numbers',
        parameters: [
          {
            name: 'a',
            type: 'number',
            description: 'First number',
            required: true
          },
          {
            name: 'b',
            type: 'number',
            description: 'Second number',
            required: true
          }
        ],
        execute: async (a: number, b: number) => a + b
      };

      templateEngine.registerFunction('math', double);
      templateEngine.registerFunction('math', add);

      const result = await templateEngine.resolve('Result: ${math.add(${math.double(2)}, 3)}');
      expect(result).toBe('Result: 7');
    });
  });

  describe('resolveObject', () => {
    it('should resolve templates in an object', async () => {
      const context = {
        env: {
          API_URL: 'https://api.example.com',
          API_KEY: 'test-api-key'
        },
        variables: {
          user: {
            id: '123'
          }
        }
      };

      const obj = {
        url: '${env.API_URL}/users/${variables.user.id}',
        headers: {
          'X-API-Key': '${env.API_KEY}'
        },
        params: {
          timestamp: Date.now()
        }
      };

      const result = await templateEngine.resolveObject(obj, context);
      
      expect(result.url).toBe('https://api.example.com/users/123');
      expect(result.headers['X-API-Key']).toBe('test-api-key');
      expect(result.params.timestamp).toBe(obj.params.timestamp);
    });

    it('should resolve templates in nested arrays', async () => {
      const context = {
        env: {
          VALUE1: 'one',
          VALUE2: 'two',
          VALUE3: 'three'
        }
      };

      const obj = {
        values: [
          '${env.VALUE1}',
          ['${env.VALUE2}', { nested: '${env.VALUE3}' }]
        ]
      };

      const result = await templateEngine.resolveObject(obj, context);
      
      expect(result.values[0]).toBe('one');
      expect(result.values[1][0]).toBe('two');
      expect((result.values[1][1] as any).nested).toBe('three');
    });

    it('should handle null and undefined values', async () => {
      const obj = {
        a: null,
        b: undefined,
        c: '${env.NON_EXISTENT}'
      };

      const result = await templateEngine.resolveObject(obj);
      
      expect(result.a).toBeNull();
      expect(result.b).toBeUndefined();
      expect(result.c).toBe('');
    });
  });
});
