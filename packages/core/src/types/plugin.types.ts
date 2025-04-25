export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider'
}

export interface AuthConfig {
  type: string;
  token?: string;
  // Extensible for different auth mechanisms
  [key: string]: any;
}

export interface SHCPlugin {
  // Required metadata
  name: string;
  version: string;
  type: PluginType;
  
  // Lifecycle hooks
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  
  // Plugin-specific implementations based on type
  execute: (...args: any[]) => Promise<any>;
  
  // Optional provided functions for template resolution
  providedFunctions?: Record<string, {
    execute: (...args: any[]) => Promise<any>;
    parameters?: any[];
  }>;
}

export interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (request: any) => Promise<any>;
}

export interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (response: any) => Promise<any>;
}

export interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (context: any) => Promise<any>;
  refresh?: (token: string) => Promise<any>;
  validate?: (token: string) => Promise<boolean>;
}

export interface PluginConfig {
  name: string;
  package: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  dependencies?: Array<{
    name: string;
    package: string;
  }>;
  permissions?: {
    filesystem?: {
      read?: string[];
      write?: string[];
    };
    network?: string[];
    env?: string[];
  };
}