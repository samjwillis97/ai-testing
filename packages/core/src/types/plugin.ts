/**
 * Available plugin types in the core package
 */
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider'
}

/**
 * Base plugin interface that all plugins must implement
 */
export interface SHCPlugin {
  name: string;
  version: string;
  type: PluginType;
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  execute: (...args: any[]) => Promise<any>;
}

/**
 * Template function parameter definition
 */
export interface TemplateFunctionParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

/**
 * Template function interface for dynamic value generation
 */
export interface TemplateFunction {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
  parameters?: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
}

/**
 * HTTP request interface
 */
export interface HTTPRequest {
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * HTTP response interface
 */
export interface HTTPResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}

/**
 * HTTP methods supported by the client
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Request preprocessor plugin interface
 */
export interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (request: HTTPRequest) => Promise<HTTPRequest>;
  providedFunctions?: Record<string, TemplateFunction>;
}

/**
 * Response transformer plugin interface
 */
export interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (response: HTTPResponse) => Promise<HTTPResponse>;
}

/**
 * Authentication context for auth providers
 */
export interface AuthContext {
  credentials?: Record<string, string>;
  scopes?: string[];
  audience?: string;
  request?: HTTPRequest;
}

/**
 * Authentication result from auth providers
 */
export interface AuthResult {
  type: 'Bearer' | 'Basic' | 'Digest' | 'Custom';
  token: string;
  expires?: Date;
  refreshToken?: string;
  scopes?: string[];
}

/**
 * Authentication provider plugin interface
 */
export interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (context: AuthContext) => Promise<AuthResult>;
  refresh?: (token: string) => Promise<AuthResult>;
  validate?: (token: string) => Promise<boolean>;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  name: string;
  package?: string;
  version?: string;
  path?: string;
  git?: string;
  ref?: string;
  enabled?: boolean;
  config?: Record<string, any>;
  permissions?: {
    network?: string[];
    filesystem?: {
      read?: string[];
      write?: string[];
    };
    env?: string[];
  };
}

export interface PluginError extends Error {
  pluginName: string;
  pluginType: PluginType;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;
}

export class PluginLoadError extends Error implements PluginError {
  pluginName: string;
  pluginType: PluginType;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;

  constructor(pluginName: string, pluginType: PluginType, cause: Error) {
    super(`Failed to load plugin ${pluginName}: ${cause.message}`);
    this.pluginName = pluginName;
    this.pluginType = pluginType;
    this.severity = 'error';
    this.recoverable = false;
    this.cause = cause;
  }
} 