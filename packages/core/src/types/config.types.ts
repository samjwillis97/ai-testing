import type { SHCConfig } from './client.types';

export interface RequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
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
}

// Used in some places for generic config objects
export type AnyObject = Record<string, unknown>;

// Used for dynamic template functions
export type TemplateFunctionType = {
  name: string;
  description?: string;
  execute: (...args: unknown[]) => Promise<unknown>;
};
