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

export interface HttpClientInterface {
  get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}

export interface HttpResponse<T> {
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
