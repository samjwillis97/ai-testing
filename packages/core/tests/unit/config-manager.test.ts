import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import path from 'path';

// Mock fs/promises BEFORE importing any modules that use it
vi.mock('fs/promises', () => {
  const mockReadFile = vi.fn();
  const mockWriteFile = vi.fn();
  const mockAccess = vi.fn();
  const mockMkdir = vi.fn();
  
  return {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    access: mockAccess,
    mkdir: mockMkdir,
    default: {
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      access: mockAccess,
      mkdir: mockMkdir,
    }
  };
});

// Import fs and other modules AFTER mocking
import * as fs from 'fs/promises';
import { createConfigManager } from '../../src/config-manager';
import { ConfigManager, TemplateFunction } from '../../src/types/config.types';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock process.env
    process.env = {
      TEST_ENV: 'test-env-value',
      API_KEY: 'test-api-key',
    };
    
    configManager = createConfigManager({
      name: 'Test Config',
      version: '1.0.0',
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('loadFromFile', () => {
    it('should load YAML configuration from file', async () => {
      const yamlContent = `
name: YAML Config
version: 2.0.0
core:
  http:
    timeout: 5000
`;
      
      vi.mocked(fs.readFile).mockResolvedValueOnce(yamlContent);
      
      await configManager.loadFromFile('/path/to/config.yaml');
      
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/config.yaml', 'utf8');
      expect(configManager.get('name')).toBe('YAML Config');
      expect(configManager.get('version')).toBe('2.0.0');
      expect(configManager.get('core.http.timeout')).toBe(5000);
    });
    
    it('should load JSON configuration from file', async () => {
      const jsonContent = JSON.stringify({
        name: 'JSON Config',
        version: '2.0.0',
        core: {
          http: {
            timeout: 5000
          }
        }
      });
      
      vi.mocked(fs.readFile).mockResolvedValueOnce(jsonContent);
      
      await configManager.loadFromFile('/path/to/config.json');
      
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/config.json', 'utf8');
      expect(configManager.get('name')).toBe('JSON Config');
      expect(configManager.get('version')).toBe('2.0.0');
      expect(configManager.get('core.http.timeout')).toBe(5000);
    });
    
    it('should throw error for unsupported file type', async () => {
      await expect(configManager.loadFromFile('/path/to/config.txt')).rejects.toThrow('Unsupported file type');
    });
    
    it('should throw error if file read fails', async () => {
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));
      
      await expect(configManager.loadFromFile('/path/to/config.yaml')).rejects.toThrow('Failed to load configuration');
    });
    
    it('should validate configuration during loading', async () => {
      const invalidYamlContent = `
name: Invalid Config
version: 2.0.0
core:
  http:
    timeout: "not-a-number"
`;
      
      vi.mocked(fs.readFile).mockResolvedValueOnce(invalidYamlContent);
      
      await expect(configManager.loadFromFile('/path/to/config.yaml')).rejects.toThrow('Invalid configuration: core.http.timeout: Expected number');
    });
  });
  
  describe('loadFromString', () => {
    it('should load configuration from YAML string', async () => {
      const yamlContent = `
name: String Config
version: 2.0.0
core:
  http:
    timeout: 5000
`;
      
      await configManager.loadFromString(yamlContent);
      
      expect(configManager.get('name')).toBe('String Config');
      expect(configManager.get('version')).toBe('2.0.0');
      expect(configManager.get('core.http.timeout')).toBe(5000);
    });
    
    it('should throw error if YAML parsing fails', async () => {
      const invalidYaml = `
name: Invalid YAML
version: 2.0.0
  invalid:
    indentation:
`;
      
      await expect(configManager.loadFromString(invalidYaml)).rejects.toThrow('Failed to parse configuration');
    });
  });
  
  describe('get, set, has', () => {
    it('should get configuration value by path', () => {
      expect(configManager.get('name')).toBe('Test Config');
      expect(configManager.get('version')).toBe('1.0.0');
    });
    
    it('should return default value if path does not exist', () => {
      expect(configManager.get('nonexistent', 'default')).toBe('default');
    });
    
    it('should set configuration value by path', () => {
      configManager.set('core.http.timeout', 10000);
      expect(configManager.get('core.http.timeout')).toBe(10000);
    });
    
    it('should create nested objects when setting deep paths', () => {
      configManager.set('deep.nested.value', 'test');
      expect(configManager.get('deep.nested.value')).toBe('test');
    });
    
    it('should check if path exists in configuration', () => {
      expect(configManager.has('name')).toBe(true);
      expect(configManager.has('nonexistent')).toBe(false);
    });
  });
  
  describe('environment variables', () => {
    it('should get environment variable', () => {
      expect(configManager.getEnv('TEST_ENV')).toBe('test-env-value');
    });
    
    it('should return default value if environment variable does not exist', () => {
      expect(configManager.getEnv('NONEXISTENT', 'default')).toBe('default');
    });
    
    it('should require environment variable', () => {
      expect(configManager.requireEnv('TEST_ENV')).toBe('test-env-value');
    });
    
    it('should throw error if required environment variable does not exist', () => {
      expect(() => configManager.requireEnv('NONEXISTENT')).toThrow('Required environment variable');
    });
  });
  
  describe('template resolution', () => {
    it('should resolve environment variables in templates', async () => {
      const result = await configManager.resolve('API Key: ${env.API_KEY}');
      expect(result).toBe('API Key: test-api-key');
    });
    
    it('should resolve config values in templates', async () => {
      const result = await configManager.resolve('App: ${config.name} v${config.version}');
      expect(result).toBe('App: Test Config v1.0.0');
    });
    
    it('should resolve template functions', async () => {
      const uppercase: TemplateFunction = {
        name: 'uppercase',
        description: 'Convert string to uppercase',
        execute: async (text: string) => text.toUpperCase(),
      };
      
      configManager.registerTemplateFunction('string', uppercase);
      
      const result = await configManager.resolve('Result: ${string.uppercase("hello")}');
      expect(result).toBe('Result: HELLO');
    });
    
    it('should resolve templates in objects', async () => {
      const obj = {
        name: '${config.name}',
        env: '${env.TEST_ENV}',
        nested: {
          value: '${env.API_KEY}'
        }
      };
      
      const result = await configManager.resolveObject(obj);
      
      expect(result.name).toBe('Test Config');
      expect(result.env).toBe('test-env-value');
      expect(result.nested.value).toBe('test-api-key');
    });
  });
  
  describe('schema validation', () => {
    it('should validate configuration schema', async () => {
      const validConfig = {
        version: '1.0.0',
        core: {
          http: {
            timeout: 5000,
            retry: {
              attempts: 3,
              backoff: 'exponential'
            }
          }
        }
      };
      
      await expect(configManager.validateConfig(validConfig)).resolves.toBe(true);
    });
    
    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        version: 123, // Should be a string
        core: {
          http: {
            timeout: 'invalid' // Should be a number
          }
        }
      };
      
      await expect(configManager.validateConfig(invalidConfig)).rejects.toThrow('Configuration version must be a string');
    });

    it('should validate against Zod schema and return validation result', async () => {
      const validConfig = {
        name: 'Test Config',
        version: '1.0.0',
        core: {
          http: {
            timeout: 5000
          }
        }
      };
      
      const result = await configManager.validateSchema(validConfig);
      expect(result.valid).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.name).toBe('Test Config');
    });
    
    it('should return validation errors for invalid schema', async () => {
      const invalidConfig = {
        name: 123, // Should be a string
        core: {
          http: {
            timeout: 'invalid' // Should be a number
          }
        }
      };
      
      const result = await configManager.validateSchema(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.some(err => err.includes('name'))).toBe(true);
      expect(result.errors?.some(err => err.includes('timeout'))).toBe(true);
    });
    
    it('should validate current configuration', async () => {
      const result = await configManager.validateCurrentConfig();
      expect(result.valid).toBe(true);
      expect(result.config).toBeDefined();
    });
  });
  
  describe('validateConfig method', () => {
    it('should validate HTTP configuration with various edge cases', async () => {
      const configManager = createConfigManager();
      
      // Test invalid HTTP timeout (string instead of number)
      const invalidTimeoutConfig = {
        core: {
          http: {
            timeout: 'invalid'
          }
        }
      };
      await expect(configManager.validateConfig(invalidTimeoutConfig)).rejects.toThrow(/HTTP timeout must be a number/);
      
      // Test invalid HTTP max_redirects (string instead of number)
      const invalidRedirectsConfig = {
        core: {
          http: {
            max_redirects: 'invalid'
          }
        }
      };
      await expect(configManager.validateConfig(invalidRedirectsConfig)).rejects.toThrow(/HTTP max_redirects must be a number/);
      
      // Test invalid HTTP retry attempts (string instead of number)
      const invalidRetryAttemptsConfig = {
        core: {
          http: {
            retry: {
              attempts: 'invalid'
            }
          }
        }
      };
      await expect(configManager.validateConfig(invalidRetryAttemptsConfig)).rejects.toThrow(/HTTP retry attempts must be a number/);
      
      // Test invalid HTTP retry backoff (number instead of string)
      const invalidRetryBackoffConfig = {
        core: {
          http: {
            retry: {
              backoff: 123
            }
          }
        }
      };
      await expect(configManager.validateConfig(invalidRetryBackoffConfig)).rejects.toThrow(/HTTP retry backoff must be a string/);
    });
    
    it('should validate logging configuration with various edge cases', async () => {
      const configManager = createConfigManager();
      
      // Test invalid logging level (number instead of string)
      const invalidLevelConfig = {
        core: {
          logging: {
            level: 123
          }
        }
      };
      await expect(configManager.validateConfig(invalidLevelConfig)).rejects.toThrow(/Logging level must be a string/);
      
      // Test invalid logging format (number instead of string)
      const invalidFormatConfig = {
        core: {
          logging: {
            format: 123
          }
        }
      };
      await expect(configManager.validateConfig(invalidFormatConfig)).rejects.toThrow(/Logging format must be a string/);
      
      // Test invalid logging output (number instead of string)
      const invalidOutputConfig = {
        core: {
          logging: {
            output: 123
          }
        }
      };
      await expect(configManager.validateConfig(invalidOutputConfig)).rejects.toThrow(/Logging output must be a string/);
    });
    
    it('should validate storage configuration with various edge cases', async () => {
      const configManager = createConfigManager();
      
      // Test invalid storage collections type (number instead of string)
      const invalidTypeConfig = {
        storage: {
          collections: {
            type: 123
          }
        }
      };
      await expect(configManager.validateConfig(invalidTypeConfig)).rejects.toThrow(/Storage collections type must be a string/);
      
      // Test invalid storage collections path (number instead of string)
      const invalidPathConfig = {
        storage: {
          collections: {
            path: 123
          }
        }
      };
      await expect(configManager.validateConfig(invalidPathConfig)).rejects.toThrow(/Storage collections path must be a string/);
    });
  });

  describe('resolveObject method with edge cases', () => {
    it('should handle circular references gracefully', async () => {
      const configManager = createConfigManager();
      
      // Create an object with circular reference
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should not throw an error
      await expect(configManager.resolveObject(circular)).resolves.toBeDefined();
    });
    
    it('should handle null and undefined values', async () => {
      const configManager = createConfigManager();
      
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        nestedNull: {
          value: null
        },
        array: [null, undefined, 'value']
      };
      
      const resolved = await configManager.resolveObject(obj);
      expect(resolved.nullValue).toBeNull();
      expect(resolved.undefinedValue).toBeUndefined();
      expect(resolved.nestedNull.value).toBeNull();
      expect(resolved.array[0]).toBeNull();
      expect(resolved.array[1]).toBeUndefined();
      expect(resolved.array[2]).toBe('value');
    });
    
    it('should handle complex nested objects with arrays', async () => {
      const configManager = createConfigManager();
      
      // Register a template function
      configManager.registerTemplateFunction('math', {
        name: 'add',
        description: 'Add two numbers together',
        parameters: [
          { name: 'a', type: 'number', description: 'First number', required: true },
          { name: 'b', type: 'number', description: 'Second number', required: true }
        ],
        execute: async (a: number, b: number) => {
          return String(Number(a) + Number(b));
        }
      });
      
      const complexObj = {
        simple: '${math.add(1, 2)}',
        array: ['${math.add(3, 4)}', '${math.add(5, 6)}'],
        nested: {
          value: '${math.add(7, 8)}',
          array: [
            { calc: '${math.add(9, 10)}' },
            { calc: '${math.add(11, 12)}' }
          ]
        }
      };
      
      const resolved = await configManager.resolveObject(complexObj);
      expect(resolved.simple).toBe('3');
      expect(resolved.array[0]).toBe('7');
      expect(resolved.array[1]).toBe('11');
      expect(resolved.nested.value).toBe('15');
      expect(resolved.nested.array[0].calc).toBe('19');
      expect(resolved.nested.array[1].calc).toBe('23');
    });
  });
  
  describe('saveToFile', () => {
    it('should save configuration to YAML file', async () => {
      await configManager.saveToFile('/path/to/config.yaml');
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/config.yaml',
        expect.any(String),
        'utf8'
      );
    });
    
    it('should save configuration to JSON file', async () => {
      await configManager.saveToFile('/path/to/config.json');
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/config.json',
        expect.any(String),
        'utf8'
      );
    });
    
    it('should throw error for unsupported file type', async () => {
      await expect(configManager.saveToFile('/path/to/config.txt')).rejects.toThrow('Unsupported file type');
    });
  });
  
  describe('secret management', () => {
    it('should set and get secrets', async () => {
      await configManager.setSecret('MY_SECRET', 'secret-value');
      
      const secret = await configManager.getSecret('MY_SECRET');
      expect(secret).toBe('secret-value');
    });
    
    it('should get secrets from environment variables if not in store', async () => {
      const secret = await configManager.getSecret('API_KEY');
      expect(secret).toBe('test-api-key');
    });
    
    it('should throw error if secret not found', async () => {
      await expect(configManager.getSecret('NONEXISTENT')).rejects.toThrow('Secret \'NONEXISTENT\' not found');
    });
  });
  
  describe('template function registration', () => {
    it('should register and retrieve template functions', () => {
      const func: TemplateFunction = {
        name: 'testFunc',
        description: 'A test function',
        execute: async () => 'test result'
      };
      
      configManager.registerTemplateFunction('test', func);
      
      const retrievedFunc = configManager.getTemplateFunction('test.testFunc');
      expect(retrievedFunc).toBeDefined();
      expect(retrievedFunc?.name).toBe('testFunc');
    });
    
    it('should return undefined for non-existent template functions', () => {
      const func = configManager.getTemplateFunction('nonexistent.func');
      expect(func).toBeUndefined();
    });
  });
});
