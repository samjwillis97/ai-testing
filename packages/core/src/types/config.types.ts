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
  resolve(template: string): Promise<string>;
  resolveObject<T>(obj: T): Promise<T>;
}