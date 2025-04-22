import axios, { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
import { RequestConfig, ResponseData, Plugin, Environment } from './types';

interface ClientEvents {
  'response': (response: ResponseData) => void;
  'error': (error: Error) => void;
  'plugin:added': (plugin: Plugin) => void;
  'environment:changed': (env: Environment) => void;
}

export class HttpClient extends EventEmitter<ClientEvents> {
  private axios: AxiosInstance;
  private plugins: Plugin[] = [];
  private currentEnvironment?: Environment;

  constructor(config?: RequestConfig) {
    super();
    this.axios = axios.create(config);
  }

  async request<T = unknown>(config: RequestConfig): Promise<ResponseData> {
    const startTime = Date.now();

    try {
      // Apply environment variables
      config = this.applyEnvironment(config);

      // Run request through plugins
      for (const plugin of this.plugins) {
        if (plugin.onRequest) {
          config = await plugin.onRequest(config);
        }
      }

      // Make the request
      const response = await this.axios.request<T>(config);

      // Add timing information
      const responseData: ResponseData = {
        ...response,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Run response through plugins
      for (const plugin of this.plugins) {
        if (plugin.onResponse) {
          await plugin.onResponse(responseData);
        }
      }

      this.emit('response', responseData);
      return responseData;
    } catch (error) {
      // Handle errors through plugins
      const err = error instanceof Error ? error : new Error(String(error));
      
      for (const plugin of this.plugins) {
        if (plugin.onError) {
          await plugin.onError(err);
        }
      }

      this.emit('error', err);
      throw err;
    }
  }

  use(plugin: Plugin): void {
    this.plugins.push(plugin);
    this.emit('plugin:added', plugin);
  }

  setEnvironment(env: Environment): void {
    this.currentEnvironment = env;
    this.emit('environment:changed', env);
  }

  private applyEnvironment(config: RequestConfig): RequestConfig {
    if (!this.currentEnvironment) {
      return config;
    }

    const { variables, baseUrl } = this.currentEnvironment;
    const newConfig = { ...config };

    // Apply base URL if set
    if (baseUrl && !config.baseURL) {
      newConfig.baseURL = baseUrl;
    }

    // Apply environment variables
    if (config.environmentVariables) {
      Object.entries(config.environmentVariables).forEach(([key, value]) => {
        if (typeof value === 'string') {
          let resolvedValue = value;
          Object.entries(variables).forEach(([envKey, envValue]) => {
            resolvedValue = resolvedValue.replace(`\${${envKey}}`, envValue);
          });
          config.environmentVariables![key] = resolvedValue;
        }
      });
    }

    return newConfig;
  }
} 