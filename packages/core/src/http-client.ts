import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  HttpClientInterface, 
  HttpRequestOptions, 
  HttpResponse, 
  HttpClientError,
  HttpClientPlugin
} from './types/http-client.types';

export class HttpClient implements HttpClientInterface {
  private axiosInstance: AxiosInstance;
  private plugins: HttpClientPlugin[] = [];

  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  registerPlugin(plugin: HttpClientPlugin): void {
    this.plugins.push(plugin);
  }

  private async executePluginHook<T, K extends keyof HttpClientPlugin>(
    hookName: K, 
    arg: T
  ): Promise<T> {
    let result = arg;
    for (const plugin of this.plugins) {
      const hook = plugin[hookName];
      if (hook) {
        const pluginResult = await (hook as any)(result);
        if (pluginResult !== undefined) {
          result = pluginResult;
        }
      }
    }
    return result;
  }

  private async request<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch', 
    url: string, 
    data?: any, 
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const startTime = Date.now();

    // Prepare request config
    const config: AxiosRequestConfig = {
      method,
      url,
      ...(data && { data }),
      headers: options?.headers,
      params: options?.queryParams,
      timeout: options?.timeout,
      proxy: options?.proxy,
    };

    try {
      // Run pre-request plugins
      const modifiedConfig = await this.executePluginHook('onPreRequest', config);

      // Execute request
      const response = await this.axiosInstance.request<T>(modifiedConfig);

      // Prepare response
      const httpResponse: HttpResponse<T> = {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
        responseTime: Date.now() - startTime,
        config: modifiedConfig,
      };

      // Run post-request plugins
      const finalResponse = await this.executePluginHook('onPostRequest', httpResponse);

      return finalResponse;
    } catch (error) {
      // Prepare error
      const httpError: HttpClientError = {
        name: 'HttpClientError',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        response: (error as any)?.response,
        request: (error as any)?.request,
      };

      // Run error plugins
      const finalError = await this.executePluginHook('onError', httpError);

      throw finalError;
    }
  }

  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('get', url, undefined, options);
  }

  async post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('post', url, data, options);
  }

  async put<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('put', url, data, options);
  }

  async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('delete', url, undefined, options);
  }

  async patch<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('patch', url, data, options);
  }
}

export default HttpClient;
