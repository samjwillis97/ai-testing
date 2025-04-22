import axios, { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
import type { EventEmitter as EventEmitterType } from 'eventemitter3';
import { RequestConfig, ResponseData, Plugin, Environment } from './types.js';

interface ClientEvents {
  response: (response: ResponseData) => void;
  error: (error: Error) => void;
  'plugin:added': (plugin: Plugin) => void;
  'environment:changed': (env: Environment) => void;
}

export class HttpClient extends (EventEmitter as unknown as {
  new (): EventEmitterType<ClientEvents>;
}) {
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

    // Update axios instance with new base URL
    if (env.baseUrl) {
      this.axios = axios.create({ baseURL: env.baseUrl });
    }

    this.emit('environment:changed', env);
  }

  private applyEnvironment(config: RequestConfig): RequestConfig {
    if (!this.currentEnvironment) {
      return config;
    }

    const { variables } = this.currentEnvironment;
    const newConfig = { ...config };

    // Apply environment variables to headers
    if (config.environmentVariables) {
      const headers = config.headers || {};

      Object.entries(config.environmentVariables).forEach(([key, value]) => {
        if (typeof value === 'string') {
          let resolvedValue = value;
          Object.entries(variables).forEach(([envKey, envValue]) => {
            resolvedValue = resolvedValue.replace(`\${${envKey}}`, String(envValue));
          });
          headers[key] = resolvedValue;
        }
      });

      newConfig.headers = headers;
      delete newConfig.environmentVariables;
    }

    return newConfig;
  }
}
