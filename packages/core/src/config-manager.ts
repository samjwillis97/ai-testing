import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import type { ConfigManager as IConfigManager } from './types/config.types';
import { SHCConfig } from './types/client.types';

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

      this.config = this.mergeConfigs(this.config, parsedConfig);
    } catch (error) {
      throw new Error(`Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async loadFromString(content: string): Promise<void> {
    try {
      const parsedConfig = yaml.load(content) as Partial<SHCConfig>;
      this.config = this.mergeConfigs(this.config, parsedConfig);
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

  async resolve(template: string): Promise<string> {
    // Basic template resolution with environment variables
    return template.replace(/\${env\.([^}]+)}/g, (_, envVar) => {
      return this.getEnv(envVar);
    });
  }

  async resolveObject<T>(obj: T): Promise<T> {
    const resolveValue = async (value: any): Promise<any> => {
      if (typeof value === 'string') {
        return this.resolve(value);
      }
      if (Array.isArray(value)) {
        return Promise.all(value.map(resolveValue));
      }
      if (value && typeof value === 'object') {
        const resolvedObj: any = {};
        for (const [k, v] of Object.entries(value)) {
          resolvedObj[k] = await resolveValue(v);
        }
        return resolvedObj;
      }
      return value;
    };

    return resolveValue(obj);
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
        auth: [
          ...(base.plugins?.auth || []), 
          ...(update.plugins?.auth || [])
        ],
        preprocessors: [
          ...(base.plugins?.preprocessors || []), 
          ...(update.plugins?.preprocessors || [])
        ],
        transformers: [
          ...(base.plugins?.transformers || []), 
          ...(update.plugins?.transformers || [])
        ]
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

export const createConfigManager = (initialConfig?: Partial<SHCConfig>) => 
  new ConfigManagerImpl(initialConfig);