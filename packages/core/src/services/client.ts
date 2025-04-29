import axios, { AxiosInstance, AxiosHeaders } from 'axios';
import { EventEmitter } from 'events';
import { SHCClient as ISHCClient, SHCConfig, SHCEvent, Response } from '../types/client.types';
import { RequestConfig } from '../types/config.types';
import { SHCPlugin, PluginType } from '../types/plugin.types';
import { PluginManager } from '../types/plugin-manager.types';
import { createPluginManager } from './plugin-manager';
import { createCollectionManager } from './collection-manager';
import { ConfigManagerImpl } from '../config-manager';
import { ConfigManager } from '../types/config.types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Type extensions for plugin error handling
declare module 'axios' {
  interface AxiosRequestConfig {
    pluginError?: {
      type: 'plugin-error';
      plugin: string;
      error: Error;
    };
  }

  interface AxiosResponse {
    pluginError?: {
      type: 'plugin-error';
      plugin: string;
      error: Error;
    };
  }
}

// Error type guards
function isAxiosError(error: unknown): error is import('axios').AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

function isTimeoutError(error: unknown): error is { config: { timeout: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'config' in error &&
    typeof error.config === 'object' &&
    error.config !== null &&
    'timeout' in error.config
  );
}

function isPluginError(
  error: unknown
): error is { type: 'plugin-error'; plugin: string; error: Error } {
  return (
    typeof error === 'object' && error !== null && 'type' in error && error.type === 'plugin-error'
  );
}

/**
 * Implementation of the SHC HTTP Client
 * Provides a wrapper around Axios with additional functionality
 */
export class SHCClient implements ISHCClient {
  private axiosInstance: AxiosInstance;
  private eventEmitter: EventEmitter;
  private plugins: Map<string, SHCPlugin>;
  private pluginManager: PluginManager;
  private collectionManager: unknown;
  private configManager: ConfigManagerImpl;
  private deferPluginLoading: boolean;

  /**
   * Create a new HTTP client instance with optional configuration
   * @param config Configuration object
   * @param deferPluginLoading Whether to defer plugin loading until after event handlers are registered
   */
  constructor(config?: SHCConfig, deferPluginLoading?: boolean) {
    // Initialize axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: config?.baseURL,
      timeout: config?.timeout || 30000,
      headers: config?.headers || {},
    });

    // Initialize event emitter
    this.eventEmitter = new EventEmitter();

    // Initialize plugins
    this.plugins = new Map<string, SHCPlugin>();

    // Initialize config manager
    this.configManager = new ConfigManagerImpl();

    // Initialize plugin manager
    this.pluginManager = createPluginManager();

    // Initialize collection manager with this client instance
    const storagePath = config?.storage?.collections?.path || './collections';
    this.collectionManager = createCollectionManager({
      storagePath,
      client: this,
      configManager: this.configManager,
    });

    // Set defer plugin loading flag
    this.deferPluginLoading = deferPluginLoading || false;

    // Load collections if provided in the config
    if (config?.collections) {
      this.loadCollectionsFromConfig(config).catch((error: unknown) => {
        this.eventEmitter.emit(
          'error',
          new Error(`Failed to load collections from config: ${String(error)}`)
        );
      });
    }

    // Set up request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const configWithTimestamp = { ...config, timestamp: Date.now() };
        let modifiedConfig = { ...configWithTimestamp };

        const preprocessorPlugins = Array.from(this.plugins.values()).filter(
          (plugin) => plugin.type === PluginType.REQUEST_PREPROCESSOR
        );

        for (const plugin of preprocessorPlugins) {
          try {
            const result = await plugin.execute(modifiedConfig);
            if (typeof result === 'object' && result !== null) {
              modifiedConfig = {
                timestamp: Date.now(),
                headers: new AxiosHeaders(),
                ...result,
              };
            } else {
              throw new Error('Plugin did not return a valid config object');
            }
          } catch (pluginError) {
            const errorObj = {
              type: 'plugin-error',
              plugin: plugin.name,
              error: pluginError instanceof Error ? pluginError : new Error(String(pluginError)),
            };
            this.eventEmitter.emit('error', errorObj);
            return Promise.reject(errorObj);
          }
        }

        return modifiedConfig as import('axios').InternalAxiosRequestConfig<unknown>;
      },
      (requestError) => {
        const errorObj = {
          type: 'request-error',
          error: requestError instanceof Error ? requestError : new Error(String(requestError)),
        };
        this.eventEmitter.emit('error', errorObj);
        return Promise.reject(errorObj);
      }
    );

    // Set up response interceptor
    this.axiosInstance.interceptors.response.use(
      async (response) => {
        let modifiedResponse = { ...response };
        const transformerPlugins = Array.from(this.plugins.values()).filter(
          (plugin) => plugin.type === PluginType.RESPONSE_TRANSFORMER
        );

        for (const plugin of transformerPlugins) {
          try {
            const pluginResult = await plugin.execute(modifiedResponse);
            if (
              typeof pluginResult === 'object' &&
              pluginResult !== null &&
              'data' in pluginResult &&
              'status' in pluginResult &&
              'headers' in pluginResult &&
              'config' in pluginResult
            ) {
              modifiedResponse = pluginResult as typeof modifiedResponse;
            } else {
              throw new Error('Plugin did not return a valid AxiosResponse object');
            }
          } catch (pluginError) {
            // Store plugin error but continue processing
            modifiedResponse.pluginError = {
              type: 'plugin-error',
              plugin: plugin.name,
              error: pluginError instanceof Error ? pluginError : new Error(String(pluginError)),
            };
          }
        }

        this.eventEmitter.emit('response', modifiedResponse);
        return modifiedResponse;
      },
      (responseError) => {
        this.eventEmitter.emit('error', responseError);
        return Promise.reject(responseError);
      }
    );

    // Load plugins if not deferred
    if (!this.deferPluginLoading) {
      this._loadPlugins(config);
    }
  }

  /**
   * Load plugins from the configuration
   */
  private _loadPlugins(config?: SHCConfig): void {
    // Register initial plugins if provided
    if (config?.plugins) {
      // Handle the new plugins structure
      if (config.plugins.auth) {
        config.plugins.auth.forEach((plugin) => this.use(plugin));
      }
      if (config.plugins.preprocessors) {
        config.plugins.preprocessors.forEach((plugin) => this.use(plugin));
      }
      if (config.plugins.transformers) {
        config.plugins.transformers.forEach((plugin) => this.use(plugin));
      }
    }
  }

  /**
   * Create a new HTTP client instance with default configuration
   */
  static create(): SHCClient;
  /**
   * Create a new HTTP client instance with optional configuration
   * @param config Configuration object
   * @param options Additional options for client creation
   * @param options.eventHandlers Event handlers to register before plugins are loaded
   */
  static create(
    config: SHCConfig,
    options?: { eventHandlers?: { event: SHCEvent; handler: (...args: unknown[]) => void }[] }
  ): SHCClient;
  /**
   * Create a new HTTP client instance with a ConfigManager
   * @param configManager ConfigManager instance
   * @param options Additional options for client creation
   * @param options.eventHandlers Event handlers to register before plugins are loaded
   */
  static create(
    configManager: ConfigManager,
    options?: { eventHandlers?: { event: SHCEvent; handler: (...args: unknown[]) => void }[] }
  ): SHCClient;
  /**
   * Implementation of create method that handles both config and ConfigManager
   * @param configOrManager Configuration object or ConfigManager instance
   * @param options Additional options for client creation
   */
  static create(
    configOrManager?: SHCConfig | ConfigManager,
    options?: { eventHandlers?: { event: SHCEvent; handler: (...args: unknown[]) => void }[] }
  ): SHCClient {
    let config: SHCConfig;
    let configManager: ConfigManagerImpl | null = null;

    // Extract config and configManager
    if (configOrManager && typeof configOrManager === 'object' && 'get' in configOrManager) {
      // It's a ConfigManager
      configManager = configOrManager as ConfigManagerImpl;
      config = configManager.get('') as SHCConfig;
    } else {
      // It's a regular config object or undefined
      config = (configOrManager as SHCConfig) || {};
    }

    // Create a client with deferred plugin loading
    const client = new SHCClient(config, true); // Pass true to defer plugin loading

    // Set the ConfigManager if provided
    if (configManager) {
      client._setConfigManager(configManager);
    }

    // Register event handlers if provided
    if (options?.eventHandlers) {
      for (const { event, handler } of options.eventHandlers) {
        client.on(event, handler);
      }
    }

    // Now load plugins
    client._loadPlugins(config);

    return client;
  }

  /**
   * Create a builder for configuring an SHCClient with more options
   * @param config Configuration object
   */
  static builder(config?: SHCConfig): SHCClientBuilder {
    return new SHCClientBuilder(config);
  }

  /**
   * Create a builder with a ConfigManager
   * @param configManager ConfigManager instance
   */
  static builderWithConfigManager(configManager: ConfigManager): SHCClientBuilder {
    const config = configManager.get('') as SHCConfig;
    const builder = new SHCClientBuilder(config);
    builder.setConfigManager(configManager as ConfigManagerImpl);
    return builder;
  }

  /**
   * Load collections from the configuration
   */
  private async loadCollectionsFromConfig(config: SHCConfig): Promise<void> {
    // Load collections from items array
    if (config.collections?.items && config.collections.items.length > 0) {
      for (const collection of config.collections.items) {
        try {
          // Add the collection to the manager
          if (
            typeof this.collectionManager === 'object' &&
            this.collectionManager !== null &&
            'createCollection' in this.collectionManager &&
            typeof (
              this.collectionManager as {
                createCollection: (name: string, collection: unknown) => Promise<unknown>;
              }
            ).createCollection === 'function'
          ) {
            await (
              this.collectionManager as {
                createCollection: (name: string, collection: unknown) => Promise<unknown>;
              }
            ).createCollection(collection.name, collection);
            this.eventEmitter.emit('collection:loaded', collection.name);
          } else {
            throw new Error('Collection manager does not support createCollection');
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.eventEmitter.emit(
            'error',
            new Error(`Failed to load collection ${collection.name}: ${errorMessage}`)
          );
        }
      }
    }

    // Load collections from specific file paths
    if (config.collections?.paths && config.collections.paths.length > 0) {
      for (const filePath of config.collections.paths) {
        try {
          if (
            typeof this.collectionManager === 'object' &&
            this.collectionManager !== null &&
            'loadCollection' in this.collectionManager &&
            typeof (
              this.collectionManager as {
                loadCollection: (filePath: string) => Promise<{ name: string }>;
              }
            ).loadCollection === 'function'
          ) {
            const collection = await (
              this.collectionManager as {
                loadCollection: (filePath: string) => Promise<{ name: string }>;
              }
            ).loadCollection(filePath);
            this.eventEmitter.emit('collection:loaded', collection.name);
          } else {
            throw new Error('Collection manager does not support loadCollection');
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.eventEmitter.emit(
            'error',
            new Error(`Failed to load collection from ${filePath}: ${errorMessage}`)
          );
        }
      }
    }

    // Load collections from directory
    if (config.collections?.directory) {
      try {
        const directoryPath = config.collections.directory;

        // Check if directory exists
        try {
          await fs.access(directoryPath);
        } catch {
          // Create directory if it doesn't exist
          await fs.mkdir(directoryPath, { recursive: true });
        }

        // Read all files in the directory
        const files = await fs.readdir(directoryPath);

        // Load each JSON file as a collection
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(directoryPath, file);
              if (
                typeof this.collectionManager === 'object' &&
                this.collectionManager !== null &&
                'loadCollection' in this.collectionManager &&
                typeof (
                  this.collectionManager as {
                    loadCollection: (filePath: string) => Promise<{ name: string }>;
                  }
                ).loadCollection === 'function'
              ) {
                const collection = await (
                  this.collectionManager as {
                    loadCollection: (filePath: string) => Promise<{ name: string }>;
                  }
                ).loadCollection(filePath);
                this.eventEmitter.emit('collection:loaded', collection.name);
              } else {
                throw new Error('Collection manager does not support loadCollection');
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.eventEmitter.emit(
                'error',
                new Error(`Failed to load collection from ${file}: ${errorMessage}`)
              );
            }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.eventEmitter.emit(
          'error',
          new Error(
            `Failed to load collections from directory ${config.collections.directory}: ${errorMessage}`
          )
        );
      }
    }
  }

  /**
   * Send an HTTP request with the given configuration
   */
  async request<T>(config: RequestConfig): Promise<Response<T>> {
    try {
      const startTime = Date.now();
      const axiosConfig = await this._createAxiosConfig(config);

      const response = await this.axiosInstance.request<T>(axiosConfig);

      // Check for plugin errors from response interceptor
      if (response.pluginError) {
        this.eventEmitter.emit('error', response.pluginError);
      }

      const responseTime = Date.now() - startTime;
      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        config: {
          url: response.config.url,
          method: response.config.method as RequestConfig['method'],
          headers: response.config.headers as Record<string, string>,
          params: response.config.params as Record<string, string | number | boolean>,
          body: response.config.data,
          timeout: response.config.timeout,
        },
        responseTime,
      };
    } catch (error: unknown) {
      // Handle timeout errors specifically
      if (isTimeoutError(error)) {
        const timeoutError = {
          type: 'timeout-error',
          error: new Error(`Request timed out after ${error.config.timeout}ms`),
          config: error.config,
        };
        this.eventEmitter.emit('error', timeoutError);
        throw timeoutError.error;
      }

      // Handle plugin errors from interceptor
      if (isPluginError(error)) {
        this.eventEmitter.emit('error', error);
        throw error.error;
      }

      // Handle axios errors
      if (isAxiosError(error)) {
        const message =
          error.response?.data &&
          typeof error.response.data === 'object' &&
          'message' in error.response.data
            ? String(error.response.data.message)
            : error.message;

        // For 404 errors, return the response rather than throwing
        if (error.response?.status === 404) {
          return {
            data: error.response.data as T,
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers as Record<string, string>,
            config: {
              url: error.response.config.url,
              method: error.response.config.method as RequestConfig['method'],
              headers: error.response.config.headers as Record<string, string>,
              params: error.response.config.params as Record<string, string | number | boolean>,
              body: error.response.config.data,
              timeout: error.response.config.timeout,
            },
            responseTime: 0,
          };
        }

        const axiosError = {
          type: 'axios-error',
          error: new Error(message),
          response: error.response,
        };
        this.eventEmitter.emit('error', axiosError);
        throw axiosError.error;
      }

      // Handle other errors
      const err = error instanceof Error ? error : new Error(String(error));
      this.eventEmitter.emit('error', {
        type: 'client-error',
        error: err,
      });
      throw err;
    }
  }

  /**
   * Send a GET request to the specified URL
   */
  async get<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  /**
   * Send a POST request to the specified URL with optional data
   */
  async post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      body: data,
      ...config,
    });
  }

  /**
   * Send a PUT request to the specified URL with optional data
   */
  async put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      body: data,
      ...config,
    });
  }

  /**
   * Send a DELETE request to the specified URL
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * Send a PATCH request to the specified URL with optional data
   */
  async patch<T>(url: string, data?: unknown, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'PATCH',
      body: data,
      ...config,
    });
  }

  /**
   * Send a HEAD request to the specified URL
   */
  async head<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'HEAD',
      ...config,
    });
  }

  /**
   * Send an OPTIONS request to the specified URL
   */
  async options<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'OPTIONS',
      ...config,
    });
  }

  /**
   * Set a default header for all requests
   */
  setDefaultHeader(name: string, value: string): void {
    this.axiosInstance.defaults.headers.common[name] = value;
  }

  /**
   * Set the default timeout for all requests
   */
  setTimeout(timeout: number): void {
    this.axiosInstance.defaults.timeout = timeout;
  }

  /**
   * Set the base URL for all requests
   */
  setBaseURL(url: string): void {
    this.axiosInstance.defaults.baseURL = url;
  }

  /**
   * Register a plugin with the client
   */
  use(plugin: SHCPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    // Register with the plugin manager
    this.pluginManager.register(plugin);

    // Initialize the plugin if it has an initialize method
    if (plugin.initialize) {
      plugin.initialize().catch((error: unknown) => {
        this.eventEmitter.emit(
          'error',
          new Error(`Failed to initialize plugin ${plugin.name}: ${String(error)}`)
        );
      });
    }

    // Store the plugin
    this.plugins.set(plugin.name, plugin);

    // Emit plugin registered event
    this.eventEmitter.emit('plugin:registered', plugin);
  }

  /**
   * Remove a plugin from the client
   */
  removePlugin(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);

    if (plugin) {
      // Call the destroy method if it exists
      if (plugin.destroy) {
        plugin.destroy().catch((error: unknown) => {
          this.eventEmitter.emit(
            'error',
            new Error(`Failed to destroy plugin ${pluginName}: ${String(error)}`)
          );
        });
      }

      // Remove the plugin
      this.plugins.delete(pluginName);

      // Emit plugin removed event
      this.eventEmitter.emit('plugin:removed', pluginName);
    }
  }

  /**
   * Register an event handler
   */
  on(event: SHCEvent, handler: (...args: unknown[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove an event handler
   */
  off(event: SHCEvent, handler: (...args: unknown[]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Get the collection manager instance
   */
  getCollectionManager(): unknown {
    return this.collectionManager;
  }

  /**
   * @internal Set the config manager instance
   */
  _setConfigManager(configManager: ConfigManagerImpl): void {
    this.configManager = configManager;
  }

  private async _createAxiosConfig(
    config: RequestConfig
  ): Promise<import('axios').AxiosRequestConfig> {
    const axiosConfig: import('axios').AxiosRequestConfig = {
      method: config.method,
      headers: config.headers,
      params: config.query || config.params,
      data: config.body || config.data,
      timeout: config.timeout,
    };

    // Handle URL construction
    if (!config.url && config.path) {
      const baseUrl = config.baseUrl || this.axiosInstance.defaults.baseURL;
      if (baseUrl) {
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanPath = config.path.startsWith('/') ? config.path : `/${config.path}`;
        axiosConfig.url = `${cleanBaseUrl}${cleanPath}`;
      } else {
        throw new Error('No base URL found and no URL specified in request');
      }
    } else {
      axiosConfig.url = config.url;
    }

    if (!axiosConfig.url) {
      throw new Error('Invalid URL: No URL or path specified in request');
    }

    // Apply authentication if needed
    if (config.authentication) {
      const authPlugins = Array.from(this.plugins.values()).filter(
        (plugin) => plugin.type === PluginType.AUTH_PROVIDER
      );

      for (const plugin of authPlugins) {
        try {
          type AuthResult = { token?: string; tokenType?: string };
          const authPromise = plugin.execute({
            type: config.authentication.type,
            config: config.authentication,
          });
          const authResult = (await authPromise) as AuthResult;

          if (authResult && authResult.token) {
            axiosConfig.headers = axiosConfig.headers || {};
            axiosConfig.headers['Authorization'] =
              `${authResult.tokenType || 'Bearer'} ${authResult.token}`;
          }

          break;
        } catch (error) {
          this.eventEmitter.emit('error', {
            type: 'auth-error',
            plugin: plugin.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return axiosConfig;
  }
}

class SHCClientBuilder {
  private config: SHCConfig;
  private configManager: ConfigManagerImpl | null;
  private eventHandlers: Map<SHCEvent, (...args: unknown[]) => void> = new Map();

  constructor(config?: SHCConfig) {
    this.config = config || {};
    this.configManager = null;
  }

  setConfigManager(configManager: ConfigManagerImpl): SHCClientBuilder {
    this.configManager = configManager;
    return this;
  }

  withEventHandler(event: SHCEvent, handler: (...args: unknown[]) => void): SHCClientBuilder {
    this.eventHandlers.set(event, handler);
    return this;
  }

  build(): SHCClient {
    const client = SHCClient.create(this.config);

    // Set the config manager if provided
    if (this.configManager) {
      client._setConfigManager(this.configManager);
    }

    // Register all event handlers
    this.eventHandlers.forEach((handler, event) => {
      client.on(event, handler);
    });

    return client;
  }
}
