import { RequestConfig } from './config.types';
import { SHCPlugin } from './plugin.types';

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
  baseURL?: string;
  timeout?: number;
  plugins?: SHCPlugin[];
  headers?: Record<string, string>;
}

export type SHCEvent = 
  | 'request'
  | 'response'
  | 'error';

export type EventHandler = (...args: any[]) => void;

export interface Response<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  responseTime: number;
}