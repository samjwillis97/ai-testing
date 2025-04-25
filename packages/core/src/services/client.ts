import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { EventEmitter } from 'events';
import { 
  SHCClient as ISHCClient, 
  SHCConfig, 
  SHCEvent, 
  EventHandler, 
  Response 
} from '../types/client.types';
import { RequestConfig } from '../types/config.types';
import { SHCPlugin, PluginType } from '../types/plugin.types';
import { PluginManager } from '../types/plugin-manager.types';
import { createPluginManager } from './plugin-manager';
import { CollectionManager } from '../types/collection.types';
import { CollectionManagerImpl, createCollectionManager } from './collection-manager';
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
  private collectionManager: CollectionManager;
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
      this.loadCollectionsFromConfig(config).catch((error: Error) => {
        this.eventEmitter.emit('error', new Error(`Failed to load collections from config: ${error.message}`));
      });
    }

    // Set up request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add timestamp for response time calculation
        const configWithTimestamp = { ...config, timestamp: Date.now() };
        
        // Apply request preprocessor plugins
        let modifiedConfig = { ...configWithTimestamp };
        
        // Get all request preprocessor plugins
        const preprocessorPlugins = Array.from(this.plugins.values())
          .filter(plugin => plugin.type === PluginType.REQUEST_PREPROCESSOR);
        
        // Apply each plugin in sequence
        for (const plugin of preprocessorPlugins) {
          try {
            modifiedConfig = await plugin.execute(modifiedConfig);
          } catch (error) {
            this.eventEmitter.emit('error', {
              type: 'plugin-error',
              plugin: plugin.name,
              error: error instanceof Error ? error.message : String(error),
              phase: 'request',
            });
          }
        }
        
        // Emit request event
        this.eventEmitter.emit('request', modifiedConfig);
        
        return modifiedConfig;
      },
      (error) => {
        // Emit error event
        this.eventEmitter.emit('error', error);
        return Promise.reject(error);
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
            modifiedResponse = await plugin.execute(modifiedResponse);
          } catch (error) {
            this.eventEmitter.emit('error', {
              type: 'plugin-error',
              plugin: plugin.name,
              error: error instanceof Error ? error.message : String(error),
              phase: 'response',
            });
          }
        }
        
        // Emit response event
        this.eventEmitter.emit('response', modifiedResponse);
        
        return modifiedResponse;
      },
      (error) => {
        // Emit error event
        this.eventEmitter.emit('error', error);
        return Promise.reject(error);
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
          await this.collectionManager.createCollection(collection.name, collection);
          this.eventEmitter.emit('collection:loaded', collection.name);
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
          const collection = await this.collectionManager.loadCollection(filePath);
          this.eventEmitter.emit('collection:loaded', collection.name);
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
        } catch (error) {
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
              const collection = await this.collectionManager.loadCollection(filePath);
              this.eventEmitter.emit('collection:loaded', collection.name);
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
            const authResult = await plugin.execute({ 
              type: config.authentication.type,
              config: config.authentication
            });
            
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
      if ('transformed' in response) {
        (shcResponse as any).transformed = true;
      }
      
      return shcResponse;
    } catch (error) {
      // Handle errors and convert to SHC error format
      if (axios.isAxiosError(error) && error.response) {
        // Calculate response time for errors
        const responseTime = Date.now() - (
          // Use a type assertion to access the timestamp property
          (error.config as any)?.timestamp || Date.now()
        );
        
        // Return error response with status code
        return {
          data: error.response.data as T,
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
          config: config,
          responseTime
        };
      }
      
      // For network errors or other issues
      throw error;
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
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>> {
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
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>> {
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
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>> {
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
      plugin.initialize().catch((error: Error) => {
        this.eventEmitter.emit('error', new Error(`Failed to initialize plugin ${plugin.name}: ${error.message}`));
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
        plugin.destroy().catch((error: Error) => {
          this.eventEmitter.emit('error', new Error(`Failed to destroy plugin ${pluginName}: ${error.message}`));
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
  on(event: SHCEvent, handler: EventHandler): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Remove an event handler
   */
  off(event: SHCEvent, handler: EventHandler): void {
    this.eventEmitter.off(event, handler);
  }

  /**
   * Get the collection manager instance
   */
  getCollectionManager(): CollectionManager {
    return this.collectionManager;
  }
}
