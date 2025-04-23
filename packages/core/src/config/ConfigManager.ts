import { parse as parseYaml } from 'yaml';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export interface ConfigSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, ConfigSchema>;
  items?: ConfigSchema;
  required?: string[];
  pattern?: string;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  default?: any;
}

export interface ConfigOptions {
  schema?: ConfigSchema;
  env?: Record<string, string | undefined>;
  baseDir?: string;
}

export class ConfigManager {
  private config: any;
  private schema: ConfigSchema | undefined;
  private env: Record<string, string | undefined>;
  private baseDir: string;

  constructor(options: ConfigOptions = {}) {
    this.schema = options.schema;
    this.env = options.env || process.env;
    this.baseDir = options.baseDir || process.cwd();
  }

  /**
   * Load configuration from a YAML or JSON file
   */
  public async loadFromFile(filePath: string): Promise<void> {
    const resolvedPath = resolve(this.baseDir, filePath);
    const content = await readFile(resolvedPath, 'utf-8');
    
    try {
      this.config = parseYaml(content);
    } catch (error) {
      throw new Error(`Failed to parse config file: ${(error as Error).message}`);
    }

    if (this.schema) {
      this.validateConfig(this.config, this.schema);
    }

    await this.resolveEnvVars(this.config);
  }

  /**
   * Get a configuration value by path
   */
  public get<T>(path: string): T {
    return this.getValueByPath(this.config, path);
  }

  /**
   * Set a configuration value by path
   */
  public set(path: string, value: any): void {
    this.setValueByPath(this.config, path, value);
    
    if (this.schema) {
      this.validateConfig(this.config, this.schema);
    }
  }

  /**
   * Get the entire configuration object
   */
  public getConfig(): any {
    return this.config;
  }

  /**
   * Validate configuration against schema
   */
  private validateConfig(config: any, schema: ConfigSchema, path: string = ''): void {
    if (!config && schema.default !== undefined) {
      config = schema.default;
      return;
    }

    switch (schema.type) {
      case 'object':
        if (typeof config !== 'object' || Array.isArray(config)) {
          throw new ConfigValidationError(
            `${path}: Expected object, got ${typeof config}`
          );
        }

        if (schema.required) {
          for (const required of schema.required) {
            if (!(required in config)) {
              throw new ConfigValidationError(
                `${path}: Missing required property "${required}"`
              );
            }
          }
        }

        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            if (key in config) {
              this.validateConfig(
                config[key],
                propSchema,
                path ? `${path}.${key}` : key
              );
            }
          }
        }
        break;

      case 'array':
        if (!Array.isArray(config)) {
          throw new ConfigValidationError(
            `${path}: Expected array, got ${typeof config}`
          );
        }

        if (schema.items) {
          for (let i = 0; i < config.length; i++) {
            this.validateConfig(
              config[i],
              schema.items,
              `${path}[${i}]`
            );
          }
        }
        break;

      case 'string':
        if (typeof config !== 'string') {
          throw new ConfigValidationError(
            `${path}: Expected string, got ${typeof config}`
          );
        }

        if (schema.pattern && !new RegExp(schema.pattern).test(config)) {
          throw new ConfigValidationError(
            `${path}: String does not match pattern ${schema.pattern}`
          );
        }

        if (schema.enum && !schema.enum.includes(config)) {
          throw new ConfigValidationError(
            `${path}: Value must be one of ${schema.enum.join(', ')}`
          );
        }
        break;

      case 'number':
        if (typeof config !== 'number') {
          throw new ConfigValidationError(
            `${path}: Expected number, got ${typeof config}`
          );
        }

        if (schema.minimum !== undefined && config < schema.minimum) {
          throw new ConfigValidationError(
            `${path}: Value must be >= ${schema.minimum}`
          );
        }

        if (schema.maximum !== undefined && config > schema.maximum) {
          throw new ConfigValidationError(
            `${path}: Value must be <= ${schema.maximum}`
          );
        }
        break;

      case 'boolean':
        if (typeof config !== 'boolean') {
          throw new ConfigValidationError(
            `${path}: Expected boolean, got ${typeof config}`
          );
        }
        break;
    }
  }

  /**
   * Resolve environment variables in configuration
   */
  private async resolveEnvVars(obj: any): Promise<void> {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        obj[key] = this.resolveEnvString(value);
      } else if (typeof value === 'object') {
        await this.resolveEnvVars(value);
      }
    }
  }

  /**
   * Resolve environment variables in a string
   */
  private resolveEnvString(str: string): string {
    return str.replace(/\${([^}]+)}/g, (match, envVar) => {
      const [name, defaultValue] = envVar.split(':-');
      const value = this.env[name];
      return value !== undefined ? value : (defaultValue || match);
    });
  }

  /**
   * Get a value from an object by dot-notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, part) => {
      if (current === undefined) {
        throw new Error(`Configuration path "${path}" not found`);
      }
      return current[part];
    }, obj);
  }

  /**
   * Set a value in an object by dot-notation path
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    const last = parts.pop()!;
    
    const target = parts.reduce((current, part) => {
      if (!(part in current)) {
        current[part] = {};
      }
      return current[part];
    }, obj);

    target[last] = value;
  }
} 