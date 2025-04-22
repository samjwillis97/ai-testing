import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpClientInterface, HttpRequestOptions, HttpResponse, HttpClientError } from './types/http-client.types';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime?: number;
    };
  }
}

export class HttpClient implements HttpClientInterface {
  private axiosInstance: AxiosInstance;

  constructor(baseConfig?: AxiosRequestConfig) {
    this.axiosInstance = axios.create({
      ...baseConfig,
      timeout: baseConfig?.timeout || 10000
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        
        return {
          ...response,
          responseTime: endTime - startTime
        };
      },
      (error) => Promise.reject(this.transformError(error))
    );
  }

  private transformError(error: any): HttpClientError {
    const clientError: HttpClientError = new Error(error.message);
    clientError.name = 'HttpClientError';
    clientError.code = error.code;
    clientError.response = error.response;
    clientError.request = error.request;

    return clientError;
  }

  private prepareConfig(options?: HttpRequestOptions): AxiosRequestConfig {
    const config: AxiosRequestConfig = {
      headers: options?.headers,
      params: options?.queryParams,
      timeout: options?.timeout,
      proxy: options?.proxy ? {
        host: options.proxy.host,
        port: options.proxy.port
      } : undefined
    };

    return config;
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.get<T>(url, this.prepareConfig(options));
      return this.transformResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, this.prepareConfig(options));
      return this.transformResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async put<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, this.prepareConfig(options));
      return this.transformResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<T>(url, this.prepareConfig(options));
      return this.transformResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async patch<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<T>(url, data, this.prepareConfig(options));
      return this.transformResponse(response);
    } catch (error) {
      throw this.transformError(error);
    }
  }

  private transformResponse<T>(response: any): HttpResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
      responseTime: response.responseTime || 0,
      config: response.config
    };
  }
}

export default HttpClient;
