export interface RequestConfig {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: any;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
  authentication?: {
    type: string;
    token?: string;
    [key: string]: any;
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
    default?: any;
  }>;
  execute: (...args: any[]) => Promise<any>;
}

/**
 * Template context for resolving templates
 */
export interface TemplateContext {
  env: Record<string, string>;
  config: Record<string, any>;
  variables: Record<string, any>;
  secrets?: Record<string, string>;
  [key: string]: any;
}

export interface ConfigManager {
  // Load and parse configuration
  loadFromFile(path: string): Promise<void>;
  loadFromString(content: string): Promise<void>;
  
  // Configuration access
  get<T>(path: string, defaultValue?: T): T;
  set(path: string, value: any): void;
  has(path: string): boolean;
  
  // Environment variables
  getEnv(name: string, defaultValue?: string): string;
  requireEnv(name: string): string;
  
  // Template resolution
  resolve(template: string, context?: Partial<TemplateContext>): Promise<string>;
  resolveObject<T>(obj: T, context?: Partial<TemplateContext>): Promise<T>;
  
  // Schema validation
  validateConfig(config: Record<string, any>): Promise<boolean>;
  
  // Configuration persistence
  saveToFile(path: string): Promise<void>;
  
  // Secret management
  getSecret(key: string): Promise<string>;
  setSecret(key: string, value: string): Promise<void>;
  
  // Template function registration
  registerTemplateFunction(namespace: string, func: TemplateFunction): void;
  getTemplateFunction(path: string): TemplateFunction | undefined;
}