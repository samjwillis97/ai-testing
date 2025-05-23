import { RequestConfig } from './config.types';
import {
  SHCPlugin,
  AuthProviderPlugin,
  RequestPreprocessorPlugin,
  ResponseTransformerPlugin,
} from './plugin.types';
import { Collection } from './collection.types';

export interface SHCClient {
  // Send HTTP requests
  request<T>(config: RequestConfig): Promise<Response<T>>;
  get<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>>;
  head<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  options<T>(url: string, config?: RequestConfig): Promise<Response<T>>;

  // Configure defaults for all requests
  setDefaultHeader(name: string, value: string): void;
  setTimeout(timeout: number): void;
  setBaseURL(url: string): void;

  // Plugin management
  use(plugin: SHCPlugin): void;
  removePlugin(pluginName: string): void;

  // Event handling
  on(event: SHCEvent, handler: (...args: unknown[]) => void): void;
  off(event: SHCEvent, handler: (...args: unknown[]) => void): void;
}

export interface SHCConfig {
  name?: string;
  version?: string;
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  core?: {
    http?: {
      timeout?: number;
      max_redirects?: number;
      retry?: {
        attempts?: number;
        backoff?: string;
      };
      tls?: {
        verify?: boolean;
      };
    };
    logging?: {
      level?: string;
      format?: string;
      output?: string;
    };
  };
  variable_sets?: {
    global?: Record<string, unknown>;
    collection_defaults?: Record<string, unknown>;
    request_overrides?: Record<string, unknown>;
  };
  plugins?: {
    auth?: AuthProviderPlugin[];
    preprocessors?: RequestPreprocessorPlugin[];
    transformers?: ResponseTransformerPlugin[];
  };
  storage?: {
    collections?: {
      type?: string;
      path?: string;
      files?: string[];
      directories?: string[];
      autoload?: boolean;
    };
  };
  /**
   * Collections configuration
   */
  collections?: {
    /**
     * Collection items loaded directly into memory
     */
    items?: Collection[];
    /**
     * Paths to individual collection files
     */
    files?: string[];
    /**
     * Paths to directories containing collection files
     */
    directories?: string[];
  };
  cli?: {
    plugins?: {
      name: string;
      package?: string;
      path?: string;
      git?: string;
      ref?: string;
      version?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
    }[];
    outputFormats?: string[];
    defaultFormat?: string;
    autoComplete?: boolean;
  };
}

export type SHCEvent =
  | 'request'
  | 'response'
  | 'error'
  | 'plugin:registered'
  | 'plugin:removed'
  | 'collection:loaded'
  | 'collection:created'
  | 'collection:updated'
  | 'collection:deleted'
  // Log events
  | 'log'
  | 'log:debug'
  | 'log:info'
  | 'log:warn'
  | 'log:error';

// Re-export LogLevel and LogEvent from log-emitter.types.ts for convenience
export type { LogLevel, LogEvent } from './log-emitter.types';

export interface Response<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  responseTime: number;
  transformed?: boolean;
}
