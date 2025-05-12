import type { LogEmitter } from './log-emitter.types';

export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}

export interface AuthConfig {
  type: string;
  token?: string;
  // Extensible for different auth mechanisms
  [key: string]: unknown;
}

export interface SHCPlugin {
  // Required metadata
  name: string;
  version: string;
  type: PluginType;

  // Lifecycle hooks
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  configure?: (config: Record<string, unknown>) => Promise<void>;

  // Plugin-specific implementations based on type
  execute: (...args: unknown[]) => Promise<unknown>;

  // Optional provided functions for template resolution
  providedFunctions?: Record<
    string,
    {
      execute: (...args: unknown[]) => Promise<unknown>;
      parameters?: unknown[];
    }
  >;
  
  // Logger for the plugin
  logEmitter?: LogEmitter;
}

export interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (...args: unknown[]) => Promise<unknown>;
}

export interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (...args: unknown[]) => Promise<unknown>;
}

export interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (...args: unknown[]) => Promise<unknown>;
  refresh?: (token: string) => Promise<unknown>;
  validate?: (token: string) => Promise<boolean>;
}

export interface PluginConfig {
  name: string;
  package?: string;
  path?: string;
  git?: string;
  ref?: string;
  version?: string;
  enabled?: boolean;
  config?: Record<string, unknown>;
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
