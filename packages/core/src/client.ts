import EventEmitter from 'eventemitter3';
import type { EventEmitter as EventEmitterType } from 'eventemitter3';
import axios, { AxiosInstance, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { RequestConfig, ResponseData, Plugin, Environment, VariableSet } from './types';
import { TemplateResolver } from './plugin/TemplateResolver';
import { PluginManager } from './plugin/PluginManager';
import { PluginType } from './types/plugin';

interface ClientEvents {
  'response': (response: ResponseData) => void;
  'error': (error: Error) => void;
  'plugin:added': (plugin: Plugin) => void;
  'environment:changed': (env: Environment) => void;
  'variableset:changed': (variableSet: VariableSet) => void;
}

export class HttpClient extends (EventEmitter as unknown as {
  new (): EventEmitterType<ClientEvents>;
}) {
  private axios: AxiosInstance;
  private currentEnvironment?: Environment;
  private variableSets: Map<string, VariableSet> = new Map();
  private activeVariableSets: Set<string> = new Set();
  private templateResolver: TemplateResolver;
  private pluginManager: PluginManager;

  constructor(config?: { pluginManager: PluginManager; templateResolver: TemplateResolver }) {
    super();
    this.axios = axios.create();
    this.pluginManager = config?.pluginManager || new PluginManager({
      packageManager: 'pnpm',
      pluginsDir: './plugins'
    });
    this.templateResolver = config?.templateResolver || new TemplateResolver(this.pluginManager);
  }

  async request<T = unknown>(config: RequestConfig): Promise<ResponseData> {
    const startTime = Date.now();

    try {
      // Ensure config has required fields
      const normalizedConfig: RequestConfig = {
        headers: {},
        ...config
      };

      // Resolve templates in the request config
      const resolvedConfig = await this.templateResolver.resolveObject(normalizedConfig) as RequestConfig;

      // Apply environment variables and variable sets
      const configWithEnv = this.applyEnvironment(resolvedConfig);

      // Get and execute request preprocessor plugins
      const preprocessors = this.pluginManager.getPluginsByType(PluginType.REQUEST_PREPROCESSOR) || [];
      let processedConfig = configWithEnv;
      
      for (const plugin of preprocessors) {
        try {
          processedConfig = await plugin.execute(processedConfig);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emit('error', err);
          throw err;
        }
      }

      // Convert RequestConfig to AxiosRequestConfig
      const axiosConfig: AxiosRequestConfig = {
        url: processedConfig.url,
        method: processedConfig.method,
        headers: { ...processedConfig.headers } as RawAxiosRequestHeaders,
        data: processedConfig.data,
        params: processedConfig.params,
        timeout: processedConfig.timeout
      };

      // Make the request
      const response = await this.axios.request<T>(axiosConfig);

      // Add timing information and ensure config is preserved
      const responseData: ResponseData = {
        ...response,
        config: processedConfig,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Get and execute response transformer plugins
      const transformers = this.pluginManager.getPluginsByType(PluginType.RESPONSE_TRANSFORMER) || [];
      let transformedResponse = responseData;

      for (const plugin of transformers) {
        try {
          transformedResponse = await plugin.execute(transformedResponse);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          this.emit('error', err);
          throw err;
        }
      }

      this.emit('response', transformedResponse);
      return transformedResponse;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('error', err);
      throw err;
    }
  }

  use(plugin: Plugin): void {
    this.pluginManager.loadPlugin(plugin);
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

  private applyEnvironment(config: RequestConfig): RequestConfig {
    if (!this.currentEnvironment) {
      return config;
    }

    const newConfig = { ...config };
    const headers = { ...config.headers } as Record<string, string>;

    // Collect all variables from environment and active variable sets
    const allVariables: Record<string, string> = {
      ...this.currentEnvironment.variables,
    };

    // Add variables from active variable sets
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

  private resolveVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\${([^}]+)}/g, (_, key) => variables[key] || '');
  }

  private getActiveVariableSets(): VariableSet[] {
    return Array.from(this.activeVariableSets)
      .map((id) => this.variableSets.get(id))
      .filter((set): set is VariableSet => set !== undefined);
  }
}
