import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { ConfigManager as IConfigManager, TemplateFunction, TemplateContext, ValidationResult } from './types/config.types';
import { SHCConfig } from './types/client.types';
import { createTemplateEngine, TemplateEngine } from './services/template-engine';
import { EventEmitter } from 'events';
import { 
  configSchema, 
  formatValidationErrors, 
  safeValidateConfig, 
  validateConfig as validateConfigSchema, 
  validatePartialConfig, 
  SHCConfigSchema 
} from './schemas/config.schema';
import { z } from 'zod';

// Add type declarations for Node.js global objects
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

export class ConfigManagerImpl implements IConfigManager {
  private config: SHCConfig;
  private env: Record<string, string>;
  private templateEngine: TemplateEngine;
  private eventEmitter: EventEmitter;
  private secretStore: Map<string, string> = new Map();

  constructor(initialConfig?: Partial<SHCConfig>) {
    this.config = {
      version: '1.0.0',
      name: initialConfig?.name || 'Default SHC Configuration',
      core: {
        http: {
          timeout: initialConfig?.core?.http?.timeout || 30000,
          max_redirects: initialConfig?.core?.http?.max_redirects || 5,
          retry: {
            attempts: initialConfig?.core?.http?.retry?.attempts || 3,
            backoff: initialConfig?.core?.http?.retry?.backoff || 'exponential'
          },
          tls: {
            verify: initialConfig?.core?.http?.tls?.verify ?? true
          }
        },
        logging: {
          level: initialConfig?.core?.logging?.level || 'info',
          format: initialConfig?.core?.logging?.format || 'text',
          output: initialConfig?.core?.logging?.output || 'console'
        }
      },
      variable_sets: {
        global: initialConfig?.variable_sets?.global || {},
        collection_defaults: initialConfig?.variable_sets?.collection_defaults || {}
      },
      plugins: {
        auth: initialConfig?.plugins?.auth || [],
        preprocessors: initialConfig?.plugins?.preprocessors || [],
        transformers: initialConfig?.plugins?.transformers || []
      },
      storage: {
        collections: {
          type: initialConfig?.storage?.collections?.type || 'file',
          path: initialConfig?.storage?.collections?.path || './collections'
        }
      }
    };

    this.env = Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
    );

    this.templateEngine = createTemplateEngine();
    this.eventEmitter = new EventEmitter();
  }

  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      const fileContent = await fs.readFile(filePath, 'utf8');

      let parsedConfig: Partial<SHCConfig>;
      if (fileExt === '.yaml' || fileExt === '.yml') {
        parsedConfig = yaml.load(fileContent) as Partial<SHCConfig>;
      } else if (fileExt === '.json') {
        parsedConfig = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }

      // Validate the configuration using Zod schema
      const validationResult = await this.validateSchema(parsedConfig);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors?.join(', ')}`);
      }

      this.config = this.mergeConfigs(this.config, parsedConfig);
      this.eventEmitter.emit('config:loaded', this.config);
    } catch (error) {
      throw new Error(`Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async loadFromString(content: string): Promise<void> {
    try {
      const parsedConfig = yaml.load(content) as Partial<SHCConfig>;
      
      // Validate the configuration using Zod schema
      const validationResult = await this.validateSchema(parsedConfig);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors?.join(', ')}`);
      }
      
      this.config = this.mergeConfigs(this.config, parsedConfig);
      this.eventEmitter.emit('config:loaded', this.config);
    } catch (error) {
      throw new Error(`Failed to parse configuration string: ${error instanceof Error ? error.message : error}`);
    }
  }

  get<T>(path: string, defaultValue?: T): T {
    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    let current = this.config as any;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    this.eventEmitter.emit('config:updated', { path, value });
  }

  has(path: string): boolean {
    const keys = path.split('.');
    let current: any = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }

    return true;
  }

  getEnv(name: string, defaultValue?: string): string {
    return this.env[name] || defaultValue || '';
  }

  requireEnv(name: string): string {
    const value = this.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  async resolve(template: string, context?: Partial<TemplateContext>): Promise<string> {
    // Create a context with config and env
    const resolveContext: Partial<TemplateContext> = {
      env: this.env,
      config: this.config,
      ...context
    };
    
    return this.templateEngine.resolve(template, resolveContext);
  }

  async resolveObject<T>(obj: T, context?: Partial<TemplateContext>): Promise<T> {
    // Create a context with config and env
    const resolveContext: Partial<TemplateContext> = {
      env: this.env,
      config: this.config,
      ...context
    };
    
    return this.templateEngine.resolveObject(obj, resolveContext);
  }

  async validateConfig(config: Record<string, any>): Promise<boolean> {
    // Basic validation for backward compatibility
    if (!config) {
      throw new Error('Configuration cannot be null or undefined');
    }

    // Check version
    if (config.version && typeof config.version !== 'string') {
      throw new Error('Configuration version must be a string');
    }

    // Check HTTP configuration
    if (config.core?.http) {
      const http = config.core.http;
      
      if (http.timeout !== undefined && typeof http.timeout !== 'number') {
        throw new Error('HTTP timeout must be a number');
      }
      
      if (http.max_redirects !== undefined && typeof http.max_redirects !== 'number') {
        throw new Error('HTTP max_redirects must be a number');
      }
      
      if (http.retry) {
        if (http.retry.attempts !== undefined && typeof http.retry.attempts !== 'number') {
          throw new Error('HTTP retry attempts must be a number');
        }
        
        if (http.retry.backoff !== undefined && typeof http.retry.backoff !== 'string') {
          throw new Error('HTTP retry backoff must be a string');
        }
      }
    }

    // Check logging configuration
    if (config.core?.logging) {
      const logging = config.core.logging;
      
      if (logging.level !== undefined && typeof logging.level !== 'string') {
        throw new Error('Logging level must be a string');
      }
      
      if (logging.format !== undefined && typeof logging.format !== 'string') {
        throw new Error('Logging format must be a string');
      }
      
      if (logging.output !== undefined && typeof logging.output !== 'string') {
        throw new Error('Logging output must be a string');
      }
    }

    // Check storage configuration
    if (config.storage?.collections) {
      const collections = config.storage.collections;
      
      if (collections.type !== undefined && typeof collections.type !== 'string') {
        throw new Error('Storage collections type must be a string');
      }
      
      if (collections.path !== undefined && typeof collections.path !== 'string') {
        throw new Error('Storage collections path must be a string');
      }
    }

    // All validations passed
    return true;
  }

  async validateSchema(config: unknown): Promise<ValidationResult> {
    try {
      // For partial configs, use validatePartialConfig
      const validatedConfig = validatePartialConfig(config);
      return {
        valid: true,
        config: validatedConfig as SHCConfigSchema
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(err => {
            const path = err.path.join('.');
            return `${path ? path + ': ' : ''}${err.message}`;
          })
        };
      }
      
      // For non-Zod errors
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async validateCurrentConfig(): Promise<ValidationResult> {
    return this.validateSchema(this.config);
  }

  async saveToFile(filePath: string): Promise<void> {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      let content: string;
      
      if (fileExt === '.yaml' || fileExt === '.yml') {
        content = yaml.dump(this.config);
      } else if (fileExt === '.json') {
        content = JSON.stringify(this.config, null, 2);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }
      
      // Ensure directory exists
      const directory = path.dirname(filePath);
      try {
        await fs.access(directory);
      } catch {
        await fs.mkdir(directory, { recursive: true });
      }
      
      await fs.writeFile(filePath, content, 'utf8');
      this.eventEmitter.emit('config:saved', filePath);
    } catch (error) {
      throw new Error(`Failed to save configuration to ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getSecret(key: string): Promise<string> {
    // First check the secret store
    const storedSecret = this.secretStore.get(key);
    if (storedSecret) {
      return storedSecret;
    }
    
    // Then check environment variables
    const envSecret = this.getEnv(key);
    if (envSecret) {
      return envSecret;
    }
    
    throw new Error(`Secret '${key}' not found`);
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secretStore.set(key, value);
    this.eventEmitter.emit('secret:updated', key);
  }

  registerTemplateFunction(namespace: string, func: TemplateFunction): void {
    this.templateEngine.registerFunction(namespace, func);
    this.eventEmitter.emit('template:function:registered', { namespace, functionName: func.name });
  }

  getTemplateFunction(path: string): TemplateFunction | undefined {
    return this.templateEngine.getFunction(path);
  }

  private mergeConfigs(base: SHCConfig, update?: Partial<SHCConfig>): SHCConfig {
    if (!update) return base;

    // Create a deep copy of the base config to avoid modifying it directly
    const result: SHCConfig = {
      ...base,
      ...update,
      core: {
        ...base.core,
        ...update.core,
        http: {
          ...(base.core?.http || {}),
          ...(update.core?.http || {}),
          retry: {
            ...(base.core?.http?.retry || {}),
            ...(update.core?.http?.retry || {})
          },
          tls: {
            ...(base.core?.http?.tls || {}),
            ...(update.core?.http?.tls || {})
          }
        },
        logging: {
          ...(base.core?.logging || {}),
          ...(update.core?.logging || {})
        }
      },
      variable_sets: {
        ...(base.variable_sets || {}),
        ...(update.variable_sets || {}),
        global: {
          ...(base.variable_sets?.global || {}),
          ...(update.variable_sets?.global || {})
        },
        collection_defaults: {
          ...(base.variable_sets?.collection_defaults || {}),
          ...(update.variable_sets?.collection_defaults || {})
        }
      },
      plugins: {
        ...(base.plugins || {}),
        ...(update.plugins || {}),
        auth: [...(base.plugins?.auth || []), ...(update.plugins?.auth || [])],
        preprocessors: [...(base.plugins?.preprocessors || []), ...(update.plugins?.preprocessors || [])],
        transformers: [...(base.plugins?.transformers || []), ...(update.plugins?.transformers || [])]
      },
      storage: {
        ...(base.storage || {}),
        ...(update.storage || {}),
        collections: {
          ...(base.storage?.collections || {}),
          ...(update.storage?.collections || {})
        }
      }
    };

    return result;
  }
}

export function createConfigManager(initialConfig?: Partial<SHCConfig>): IConfigManager {
  return new ConfigManagerImpl(initialConfig);
}