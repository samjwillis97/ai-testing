import axios, { AxiosInstance, AxiosRequestConfig, AxiosHeaders } from 'axios';
import { EventEmitter } from 'events';
import { 
  SHCClient as ISHCClient, 
  SHCConfig, 
  SHCEvent, 
  Response 
} from '../types/client.types';
import { RequestConfig } from '../types/config.types';
import { SHCPlugin, PluginType } from '../types/plugin.types';
import { PluginManager } from '../types/plugin-manager.types';
import { createPluginManager } from './plugin-manager';
import { createCollectionManager } from './collection-manager';
import { ConfigManagerImpl } from '../config-manager';
import * as fs from 'fs/promises';
import * as path from 'path';

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

  /**
   * Create a new HTTP client instance with optional configuration
   */
  static create(config?: SHCConfig): SHCClient {
    return new SHCClient(config);
  }

  constructor(config?: SHCConfig) {
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
      configManager: this.configManager
    });

    // Register initial plugins if provided
    if (config?.plugins) {
      // Handle the new plugins structure
      if (config.plugins.auth) {
        config.plugins.auth.forEach(plugin => this.use(plugin));
      }
      if (config.plugins.preprocessors) {
        config.plugins.preprocessors.forEach(plugin => this.use(plugin));
      }
      if (config.plugins.transformers) {
        config.plugins.transformers.forEach(plugin => this.use(plugin));
      }
    }

    // Load collections if provided in the config
    if (config?.collections) {
      this.loadCollectionsFromConfig(config).catch((error: unknown) => {
        this.eventEmitter.emit('error', new Error(`Failed to load collections from config: ${error}`));
      });
    }

    // Set up request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add timestamp for response time calculation
        const configWithTimestamp = { ...config, timestamp: Date.now() as number };
        
        // Apply request preprocessor plugins
        let modifiedConfig = { ...configWithTimestamp };
        
        // Get all request preprocessor plugins
        const preprocessorPlugins = Array.from(this.plugins.values())
          .filter(plugin => plugin.type === PluginType.REQUEST_PREPROCESSOR);
        
        // Apply each plugin in sequence
        for (const plugin of preprocessorPlugins) {
          try {
            const result = await plugin.execute(modifiedConfig);
            // Ensure result is an object
            if (typeof result === 'object' && result !== null) {
              // Always start with a base config with required properties
              modifiedConfig = {
                timestamp: Date.now(),
                headers: new AxiosHeaders(),
                ...result,
              };
            } else {
              throw new Error('Plugin did not return a valid config object');
            }
            // Ensure timestamp and headers are present (redundant, but safe)
            if (
              typeof modifiedConfig === 'object' && modifiedConfig !== null &&
              'timestamp' in modifiedConfig &&
              typeof (modifiedConfig as { timestamp?: number }).timestamp !== 'number'
            ) {
              (modifiedConfig as { timestamp?: number }).timestamp = Date.now();
            }
            if (
              typeof modifiedConfig === 'object' && modifiedConfig !== null &&
              !('headers' in modifiedConfig)
            ) {
              (modifiedConfig as { headers?: AxiosHeaders }).headers = new AxiosHeaders();
            }
          } catch (pluginError) {
            this.eventEmitter.emit('error', {
              type: 'plugin-error',
              plugin: plugin.name,
              error: pluginError,
            });
          }
        }
        
        // Ensure type for InternalAxiosRequestConfig<any>
        if (
          typeof modifiedConfig === 'object' &&
          modifiedConfig !== null &&
          'headers' in modifiedConfig &&
          typeof (modifiedConfig as { headers?: unknown }).headers === 'object'
        ) {
          return modifiedConfig as import('axios').InternalAxiosRequestConfig<unknown>;
        }
        // Fallback: create a valid config with required fields
        return {
          ...modifiedConfig,
          headers: (modifiedConfig && typeof modifiedConfig === 'object' && 'headers' in modifiedConfig)
            ? (modifiedConfig as { headers: unknown }).headers
            : {},
        } as import('axios').InternalAxiosRequestConfig<unknown>;
      },
      (requestError) => {
        // Emit error event
        this.eventEmitter.emit('error', requestError);
        return Promise.reject(requestError);
      }
    );

    // Set up response interceptor
    this.axiosInstance.interceptors.response.use(
      async (response) => {
        // Apply response transformer plugins
        let modifiedResponse = { ...response };
        
        // Get all response transformer plugins
        const transformerPlugins = Array.from(this.plugins.values())
          .filter(plugin => plugin.type === PluginType.RESPONSE_TRANSFORMER);
        
        // Apply each plugin in sequence
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
            this.eventEmitter.emit('error', {
              type: 'plugin-error',
              plugin: plugin.name,
              error: pluginError,
            });
          }
        }
        
        // Emit response event
        this.eventEmitter.emit('response', modifiedResponse);
        
        return modifiedResponse;
      },
      (responseError) => {
        // Emit error event
        this.eventEmitter.emit('error', responseError);
        return Promise.reject(responseError);
      }
    );
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
            typeof (this.collectionManager as { createCollection: (name: string, collection: unknown) => Promise<unknown> }).createCollection === 'function'
          ) {
            await (this.collectionManager as { createCollection: (name: string, collection: unknown) => Promise<unknown> }).createCollection(collection.name, collection);
            this.eventEmitter.emit('collection:loaded', collection.name);
          } else {
            throw new Error('Collection manager does not support createCollection');
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.eventEmitter.emit('error', new Error(`Failed to load collection ${collection.name}: ${errorMessage}`));
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
            typeof (this.collectionManager as { loadCollection: (filePath: string) => Promise<{ name: string }> }).loadCollection === 'function'
          ) {
            const collection = await (this.collectionManager as { loadCollection: (filePath: string) => Promise<{ name: string }> }).loadCollection(filePath);
            this.eventEmitter.emit('collection:loaded', collection.name);
          } else {
            throw new Error('Collection manager does not support loadCollection');
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.eventEmitter.emit('error', new Error(`Failed to load collection from ${filePath}: ${errorMessage}`));
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
                typeof (this.collectionManager as { loadCollection: (filePath: string) => Promise<{ name: string }> }).loadCollection === 'function'
              ) {
                const collection = await (this.collectionManager as { loadCollection: (filePath: string) => Promise<{ name: string }> }).loadCollection(filePath);
                this.eventEmitter.emit('collection:loaded', collection.name);
              } else {
                throw new Error('Collection manager does not support loadCollection');
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              this.eventEmitter.emit('error', new Error(`Failed to load collection from ${file}: ${errorMessage}`));
            }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.eventEmitter.emit('error', new Error(`Failed to load collections from directory ${config.collections.directory}: ${errorMessage}`));
      }
    }
  }

  /**
   * Send an HTTP request with the given configuration
   */
  async request<T>(config: RequestConfig): Promise<Response<T>> {
    try {
      // Track request start time for response time calculation
      const startTime = Date.now();
      
      // Convert SHC RequestConfig to Axios RequestConfig
      const axiosConfig: AxiosRequestConfig = {
        url: config.url,
        method: config.method,
        headers: config.headers,
        params: config.query || config.params,
        data: config.body,
        timeout: config.timeout,
      };

      // Apply authentication if needed
      if (config.authentication) {
        // Find an auth provider plugin that can handle this authentication type
        const authPlugins = Array.from(this.plugins.values())
          .filter(plugin => plugin.type === PluginType.AUTH_PROVIDER);
        
        for (const plugin of authPlugins) {
          try {
            type AuthResult = { token?: string; tokenType?: string };
            const authResult = await plugin.execute({ 
              type: config.authentication.type,
              config: config.authentication
            }) as AuthResult;
            
            // Apply the authentication result to the request
            if (authResult && authResult.token) {
              axiosConfig.headers = axiosConfig.headers || {};
              axiosConfig.headers['Authorization'] = `${authResult.tokenType || 'Bearer'} ${authResult.token}`;
            }
            
            break; // Use the first successful auth plugin
          } catch (error) {
            this.eventEmitter.emit('error', {
              type: 'auth-error',
              plugin: plugin.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      // Send the request
      const response = await this.axiosInstance.request<T>(axiosConfig);
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Convert Axios response to SHC response
      const shcResponse: Response<T> = {
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
          timeout: response.config.timeout
        },
        responseTime
      };
      
      // If the response has been transformed by a plugin, include those properties
      if (typeof response === 'object' && response !== null && 'transformed' in response) {
        (shcResponse as { transformed?: boolean }).transformed = true;
      }
      
      return shcResponse;
    } catch (error) {
      // Handle errors and convert to SHC error format
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        'status' in error.response &&
        'headers' in error.response &&
        'config' in error.response &&
        typeof (error.response as { config: unknown }).config === 'object' &&
        error.response.config !== null
      ) {
        const errResp = error.response as {
          data: unknown;
          status: number;
          statusText: string;
          headers: Record<string, string>;
          config: {
            url: string;
            method: RequestConfig['method'];
            headers: Record<string, string>;
            params: Record<string, string | number | boolean>;
            data: unknown;
            timeout: number;
            timestamp?: number;
          };
        };
        // Calculate response time for errors
        let responseTime = Date.now();
        const errConfig = errResp.config;
        if (
          errConfig &&
          typeof errConfig === 'object' &&
          'timestamp' in errConfig
        ) {
          const ts = (errConfig as { timestamp?: unknown }).timestamp;
          if (typeof ts === 'number') {
            responseTime -= ts;
          }
        }
        return {
          data: errResp.data as T,
          status: errResp.status,
          statusText: errResp.statusText,
          headers: errResp.headers,
          config: config,
          responseTime
        };
      } else {
        throw error;
      }
    }
  }

  /**
   * Send a GET request to the specified URL
   */
  async get<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...config
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
      ...config
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
      ...config
    });
  }

  /**
   * Send a DELETE request to the specified URL
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config
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
      ...config
    });
  }

  /**
   * Send a HEAD request to the specified URL
   */
  async head<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'HEAD',
      ...config
    });
  }

  /**
   * Send an OPTIONS request to the specified URL
   */
  async options<T>(url: string, config?: RequestConfig): Promise<Response<T>> {
    return this.request<T>({
      url,
      method: 'OPTIONS',
      ...config
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
        this.eventEmitter.emit('error', new Error(`Failed to initialize plugin ${plugin.name}: ${error}`));
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
          this.eventEmitter.emit('error', new Error(`Failed to destroy plugin ${pluginName}: ${error}`));
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
}
