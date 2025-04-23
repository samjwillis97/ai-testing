import axios, { AxiosInstance } from 'axios';
import EventEmitter from 'eventemitter3';
import type { EventEmitter as EventEmitterType } from 'eventemitter3';
import { RequestConfig, ResponseData, Plugin, Environment, VariableSet } from './types.js';

interface ClientEvents {
  response: (response: ResponseData) => void;
  error: (error: Error) => void;
  'plugin:added': (plugin: Plugin) => void;
  'environment:changed': (env: Environment) => void;
  'variableset:changed': (variableSet: VariableSet) => void;
}

export class HttpClient extends (EventEmitter as unknown as {
  new (): EventEmitterType<ClientEvents>;
}) {
  private axios: AxiosInstance;
  private plugins: Plugin[] = [];
  private currentEnvironment?: Environment;
  private variableSets: Map<string, VariableSet> = new Map();
  private activeVariableSets: Set<string> = new Set();

  constructor(config?: RequestConfig) {
    super();
    this.axios = axios.create(config);
  }

  async request<T = unknown>(config: RequestConfig): Promise<ResponseData> {
    const startTime = Date.now();

    try {
      // Apply environment variables and variable sets
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

    // Activate variable sets associated with the environment
    this.activeVariableSets.clear();
    if (env.variableSets) {
      env.variableSets.forEach((id) => this.activeVariableSets.add(id));
    }

    this.emit('environment:changed', env);
  }

  addGlobalVariableSet(variableSet: VariableSet): void {
    this.variableSets.set(variableSet.id, variableSet);
    if (variableSet.isGlobal) {
      this.activeVariableSets.add(variableSet.id);
    }
    this.emit('variableset:changed', variableSet);
  }

  activateVariableSet(variableSetId: string): void {
    this.activeVariableSets.add(variableSetId);
  }

  deactivateVariableSet(variableSetId: string): void {
    this.activeVariableSets.delete(variableSetId);
  }

  private getActiveVariableSets(): VariableSet[] {
    return Array.from(this.variableSets.values()).filter(
      (vs) => vs.isGlobal || this.activeVariableSets.has(vs.id)
    );
  }

  private resolveVariables(value: string, variables: Record<string, string>): string {
    let resolvedValue = value;
    Object.entries(variables).forEach(([key, val]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      resolvedValue = resolvedValue.replace(regex, String(val));
    });
    return resolvedValue;
  }

  private applyEnvironment(config: RequestConfig): RequestConfig {
    if (!this.currentEnvironment) {
      return config;
    }

    const newConfig = { ...config };
    const headers = config.headers || {};

    // Collect all variables from environment and active variable sets
    const allVariables: Record<string, string> = {
      ...this.currentEnvironment.variables,
    };

    // Add variables from active variable sets (later sets override earlier ones)
    this.getActiveVariableSets().forEach((variableSet) => {
      Object.assign(allVariables, variableSet.variables);
    });

    // Apply variables to headers
    if (config.environmentVariables) {
      Object.entries(config.environmentVariables).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = this.resolveVariables(value, allVariables);
        }
      });

      newConfig.headers = headers;
      delete newConfig.environmentVariables;
    }

    // Apply variables to URL if present
    if (newConfig.url) {
      newConfig.url = this.resolveVariables(newConfig.url, allVariables);
    }

    return newConfig;
  }
}
