import type { SHCConfig } from './client.types';

export interface RequestConfig {
  url?: string;
  path?: string;
  baseUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  data?: unknown;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
  authentication?: {
    type: string;
    token?: string;
    [key: string]: unknown;
  };
}

export interface ConfigManagerOptions {
  fileTypes?: string[];
  envPrefix?: string;
  schemaValidation?: boolean;
  secretsPath?: string;
}

/**
 * Template function interface for dynamic template resolution
 */
export interface TemplateFunction {
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: unknown;
  }>;
  execute: (...args: unknown[]) => Promise<unknown>;
}

/**
 * Template context for resolving templates
 */
export interface TemplateContext {
  env: Record<string, string>;
  config: SHCConfig;
  variables: Record<string, unknown>;
  secrets?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Schema validation result
 */
export interface ValidationResult {
  /**
   * Whether validation was successful
   */
  valid: boolean;

  /**
   * Validation errors, if any
   */
  errors?: string[];

  /**
   * Validated configuration, if successful
   */
  config?: unknown;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  name: string;
  package?: string;
  path?: string;
  git?: string;
  ref?: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
  dependencies?: {
    name: string;
    package: string;
  }[];
  permissions?: {
    filesystem?: {
      read?: string[];
      write?: string[];
    };
    network?: string[];
  };
}

/**
 * CLI configuration
 */
export interface CLIConfig {
  plugins?: PluginConfig[];
  outputFormats?: string[];
  defaultFormat?: string;
  autoComplete?: boolean;
}

/**
 * Configuration manager for SHC
 */
export interface ConfigManager {
  // Load and parse configuration
  loadFromFile(path: string): Promise<void>;
  loadFromString(content: string): Promise<void>;

  // Configuration access
  get<T>(path: string, defaultValue?: T): T;
  set<T = unknown>(path: string, value: T): void;
  has(path: string): boolean;

  // Environment variables
  getEnv(name: string, defaultValue?: string): string;
  requireEnv(name: string): string;

  // Template resolution
  resolve(template: string, context?: Partial<TemplateContext>): Promise<string>;
  resolveObject<T>(obj: T, context?: Partial<TemplateContext>): Promise<T>;

  // Schema validation
  validateConfig(config: Record<string, unknown>): Promise<boolean>;
  validateSchema(config: unknown): Promise<ValidationResult>;
  validateCurrentConfig(): Promise<ValidationResult>;

  // Configuration persistence
  saveToFile(path: string): Promise<void>;

  // Secret management
  getSecret(key: string): Promise<string>;
  setSecret(key: string, value: string): Promise<void>;

  // Template function registration
  registerTemplateFunction(namespace: string, func: TemplateFunction): void;
  getTemplateFunction(path: string): TemplateFunction | undefined;

  // Path resolution
  /**
   * Resolves a path that might be relative to the config file
   * If the path is absolute, it is returned as is
   * If the path is relative and a config file is loaded, it is resolved relative to the config file's directory
   * If the path is relative and no config file is loaded, it is resolved relative to the current working directory
   * @param relativePath The path to resolve
   * @returns The resolved absolute path
   */
  resolveConfigPath(relativePath: string): string;

  /**
   * Gets the collection directory path, resolving relative paths if needed
   * This uses the storage.collections.path configuration value and resolves it
   * relative to the config file's location if applicable
   * @returns The resolved absolute path to the collections directory
   */
  getCollectionPath(): string;
}

// Used in some places for generic config objects
export type AnyObject = Record<string, unknown>;

// Used for dynamic template functions
export type TemplateFunctionType = {
  name: string;
  description?: string;
  execute: (...args: unknown[]) => Promise<unknown>;
};
