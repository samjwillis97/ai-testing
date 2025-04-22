import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  timeout?: number;
  proxy?: {
    host: string;
    port: number;
  };
}

export interface HttpClientPlugin {
  /**
   * Executed before the request is sent
   * Can modify the request configuration
   */
  onPreRequest?: (config: AxiosRequestConfig) => AxiosRequestConfig | void;

  /**
   * Executed after a successful request
   * Can transform or log the response
   */
  onPostRequest?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | void;

  /**
   * Executed when an error occurs during the request
   * Can handle or transform errors
   */
  onError?: (error: HttpClientError) => HttpClientError | void;
}

export interface HttpClientInterface {
  get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T = any>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T = any>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  
  /**
   * Register a plugin to extend HTTP client functionality
   */
  registerPlugin(plugin: HttpClientPlugin): void;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  responseTime: number;
  config: AxiosRequestConfig;
}

export interface HttpClientError extends Error {
  code?: string;
  response?: AxiosResponse;
  request?: any;
}
