import { RequestConfig } from './config.types';
import { SHCPlugin, AuthProviderPlugin, RequestPreprocessorPlugin, ResponseTransformerPlugin } from './plugin.types';
import { Collection } from './collection.types';

export interface SHCClient {
  // Send HTTP requests
  request<T>(config: RequestConfig): Promise<Response<T>>;
  get<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
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
  on(event: SHCEvent, handler: EventHandler): void;
  off(event: SHCEvent, handler: EventHandler): void;
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
    global?: Record<string, any>;
    collection_defaults?: Record<string, any>;
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
  collections?: {
    items?: Collection[];
    paths?: string[];
    directory?: string;
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
  | 'collection:deleted';

export type EventHandler = (...args: any[]) => void;

export interface Response<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  responseTime: number;
  transformed?: boolean;
}