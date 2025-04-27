import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import merge from 'lodash.merge';
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
  private configFilePath?: string;

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

      // Store the config file path for resolving relative paths
      this.configFilePath = path.resolve(filePath);

      // Process relative paths in the config
      if (parsedConfig.storage?.collections?.path && !path.isAbsolute(parsedConfig.storage.collections.path)) {
        const configDir = path.dirname(this.configFilePath);
        parsedConfig.storage.collections.path = path.resolve(configDir, parsedConfig.storage.collections.path);
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
    let current: unknown = this.config;

    for (const key of keys) {
      if (
        current &&
        typeof current === 'object' &&
        current !== null &&
        // Check if the key exists and the object has the property (for typed objects)
        (key in current || Object.prototype.hasOwnProperty.call(current, key))
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  set(path: string, value: unknown): void {
    const keys = path.split('.');
    let current: unknown = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current && typeof current === 'object' && !(key in current)) {
        (current as Record<string, unknown>)[key] = {};
      }
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      }
    }

    if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
    }
    this.eventEmitter.emit('config:updated', { path, value });
  }

  // Resolve a path that might be relative to the config file
  resolveConfigPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    
    if (this.configFilePath) {
      const configDir = path.dirname(this.configFilePath);
      return path.resolve(configDir, relativePath);
    }
    
    // If no config file path is set, resolve relative to current working directory
    return path.resolve(relativePath);
  }

  // Get the collection directory path, resolving relative paths if needed
  getCollectionPath(): string {
    const collectionPath = this.get<string>('storage.collections.path', './collections');
    return this.resolveConfigPath(collectionPath);
  }

  has(path: string): boolean {
    const keys = path.split('.');
    let current: unknown = this.config;

    for (const key of keys) {
      if (
        current &&
        typeof current === 'object' &&
        current !== null &&
        (key in current || Object.prototype.hasOwnProperty.call(current, key))
      ) {
        current = (current as Record<string, unknown>)[key];
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

  async validateConfig(config: Record<string, unknown>): Promise<boolean> {
    // Basic validation for backward compatibility
    if (!config) {
      throw new Error('Configuration cannot be null or undefined');
    }

    // Check version
    if (config.version && typeof config.version !== 'string') {
      throw new Error('Configuration version must be a string');
    }

    // Check HTTP configuration
    if (config.core && typeof config.core === 'object' && 'http' in config.core && config.core.http) {
      const http = config.core.http as {
        timeout?: unknown;
        max_redirects?: unknown;
        retry?: {
          attempts?: unknown;
          backoff?: unknown;
        };
        tls?: {
          verify?: unknown;
        };
      };
      
      if ('timeout' in http && http.timeout !== undefined && typeof http.timeout !== 'number') {
        throw new Error('HTTP timeout must be a number');
      }
      
      if ('max_redirects' in http && http.max_redirects !== undefined && typeof http.max_redirects !== 'number') {
        throw new Error('HTTP max_redirects must be a number');
      }
      
      if ('retry' in http && http.retry) {
        if ('attempts' in http.retry && http.retry.attempts !== undefined && typeof http.retry.attempts !== 'number') {
          throw new Error('HTTP retry attempts must be a number');
        }
        
        if ('backoff' in http.retry && http.retry.backoff !== undefined && typeof http.retry.backoff !== 'string') {
          throw new Error('HTTP retry backoff must be a string');
        }
      }
      
      if ('tls' in http && http.tls) {
        if ('verify' in http.tls && http.tls.verify !== undefined && typeof http.tls.verify !== 'boolean') {
          throw new Error('HTTP TLS verify must be a boolean');
        }
      }
    }

    // Check logging configuration
    if (config.core && typeof config.core === 'object' && 'logging' in config.core && config.core.logging) {
      const logging = config.core.logging as {
        level?: unknown;
        format?: unknown;
        output?: unknown;
      };
      
      if ('level' in logging && logging.level !== undefined && typeof logging.level !== 'string') {
        throw new Error('Logging level must be a string');
      }
      
      if ('format' in logging && logging.format !== undefined && typeof logging.format !== 'string') {
        throw new Error('Logging format must be a string');
      }
      
      if ('output' in logging && logging.output !== undefined && typeof logging.output !== 'string') {
        throw new Error('Logging output must be a string');
      }
    }

    // Check storage configuration
    if (config.storage && typeof config.storage === 'object' && 'collections' in config.storage && config.storage.collections) {
      const collections = config.storage.collections as {
        type?: unknown;
        path?: unknown;
      };
      
      if ('type' in collections && collections.type !== undefined && typeof collections.type !== 'string') {
        throw new Error('Storage collections type must be a string');
      }
      
      if ('path' in collections && collections.path !== undefined && typeof collections.path !== 'string') {
        throw new Error('Storage collections path must be a string');
      }
    }

    return true;
  }

  async validateSchema(config: unknown): Promise<ValidationResult> {
    try {
      const result = await configSchema.safeParseAsync(config);
      
      if (!result.success) {
        // Handle the case where result.error might be undefined
        const errors = result.error ? formatValidationErrors(result.error) : ['Unknown validation error'];
        return { valid: false, errors: Array.isArray(errors) ? errors : [errors] };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      return { 
        valid: false, 
        errors: [errorMessage] 
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
        content = yaml.dump(this.config, { indent: 2 });
      } else if (fileExt === '.json') {
        content = JSON.stringify(this.config, null, 2);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }
      
      await fs.writeFile(filePath, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save configuration to ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async getSecret(key: string): Promise<string> {
    const secret = this.secretStore.get(key);
    if (!secret) {
      throw new Error(`Secret not found: ${key}`);
    }
    return secret;
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secretStore.set(key, value);
  }

  registerTemplateFunction(namespace: string, func: TemplateFunction): void {
    this.templateEngine.registerFunction(namespace, func);
  }

  getTemplateFunction(path: string): TemplateFunction | undefined {
    return this.templateEngine.getFunction(path);
  }

  private mergeConfigs(base: SHCConfig, update?: Partial<SHCConfig>): SHCConfig {
    if (!update) {
      return base;
    }

    // Create a deep copy of the base config to avoid mutating it
    // Use lodash.merge for deep cloning instead of JSON.parse/stringify to handle functions
    const baseClone = merge({}, base);
    
    // Handle special cases for arrays that should be replaced instead of merged
    const pluginsToReplace: Record<string, boolean> = {};
    
    if (update.plugins) {
      // Mark plugin arrays that should be replaced rather than merged
      if (update.plugins.auth) pluginsToReplace['plugins.auth'] = true;
      if (update.plugins.preprocessors) pluginsToReplace['plugins.preprocessors'] = true;
      if (update.plugins.transformers) pluginsToReplace['plugins.transformers'] = true;
    }
    
    // Use lodash.merge for deep merging
    const merged = merge({}, baseClone, update);
    
    // Handle special case for plugin arrays - we want to replace them, not merge them
    if (update.plugins && merged.plugins) {
      if (pluginsToReplace['plugins.auth'] && update.plugins.auth) {
        merged.plugins.auth = [...update.plugins.auth];
      }
      
      if (pluginsToReplace['plugins.preprocessors'] && update.plugins.preprocessors) {
        merged.plugins.preprocessors = [...update.plugins.preprocessors];
      }
      
      if (pluginsToReplace['plugins.transformers'] && update.plugins.transformers) {
        merged.plugins.transformers = [...update.plugins.transformers];
      }
    }
    
    return merged;
  }
  
  // Helper method to create default core config
  private createDefaultCore(): SHCConfig['core'] {
    return {
      http: {
        timeout: 30000,
        max_redirects: 5,
        retry: {
          attempts: 3,
          backoff: 'exponential'
        },
        tls: {
          verify: true
        }
      },
      logging: {
        level: 'info',
        format: 'text',
        output: 'console'
      }
    };
  }
}

export function createConfigManager(initialConfig?: Partial<SHCConfig>): IConfigManager {
  return new ConfigManagerImpl(initialConfig);
}