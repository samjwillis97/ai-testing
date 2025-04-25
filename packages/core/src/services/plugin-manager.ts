import { EventEmitter } from 'events';
import path from 'path';
import { PluginManager as IPluginManager } from '../types/plugin-manager.types';
import { SHCPlugin, PluginConfig } from '../types/plugin.types';
import { ConfigManagerImpl } from '../config-manager';

/**
 * Implementation of the Plugin Manager
 * Manages plugin registration, lifecycle, and loading
 */
export class PluginManagerImpl implements IPluginManager {
  private plugins: Map<string, SHCPlugin>;
  private enabledPlugins: Set<string>;
  private eventEmitter: EventEmitter;
  private configManager: ConfigManagerImpl;

  constructor(options?: {
    configManager?: ConfigManagerImpl;
  }) {
    this.plugins = new Map<string, SHCPlugin>();
    this.enabledPlugins = new Set<string>();
    this.eventEmitter = new EventEmitter();
    this.configManager = options?.configManager || new ConfigManagerImpl();
  }

  /**
   * Register a plugin with the manager
   */
  register(plugin: SHCPlugin): void {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name ${plugin.name} is already registered`);
    }

    // Store the plugin
    this.plugins.set(plugin.name, plugin);
    
    // Enable the plugin by default
    this.enabledPlugins.add(plugin.name);
    
    // Emit plugin registered event
    this.eventEmitter.emit('plugin:registered', plugin);
  }

  /**
   * Register a plugin from a configuration object
   */
  async registerFromConfig(config: PluginConfig): Promise<void> {
    try {
      // Check if the plugin is enabled
      if (config.enabled === false) {
        return;
      }

      // Load the plugin based on the configuration
      let plugin: SHCPlugin;

      if (config.package) {
        // Load from npm package
        plugin = await this.loadPluginFromPackage(config.package, config.version);
      } else if (config.path) {
        // Load from local path
        plugin = await this.loadPluginFromLocalPath(config.path);
      } else if (config.git) {
        // Load from git repository
        plugin = await this.loadPluginFromGit(config.git, config.ref);
      } else {
        throw new Error('Plugin configuration must specify package, path, or git');
      }

      // Apply configuration to the plugin
      if (config.config && plugin.configure) {
        await plugin.configure(config.config);
      }

      // Register the plugin
      this.register(plugin);
    } catch (error) {
      throw new Error(`Failed to register plugin from config: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize all registered plugins
   */
  async initialize(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      if (this.isPluginEnabled(name) && plugin.initialize) {
        initPromises.push(
          plugin.initialize().catch(error => {
            // Disable the plugin if initialization fails
            this.enabledPlugins.delete(name);
            this.eventEmitter.emit('plugin:error', {
              plugin: name,
              error: `Failed to initialize plugin: ${error instanceof Error ? error.message : String(error)}`
            });
            // Don't rethrow, just log the error and continue with other plugins
          })
        );
      }
    }

    await Promise.all(initPromises);
  }

  /**
   * Destroy all registered plugins
   */
  async destroy(): Promise<void> {
    const destroyPromises: Promise<void>[] = [];

    for (const [name, plugin] of this.plugins.entries()) {
      if (this.isPluginEnabled(name) && plugin.destroy) {
        destroyPromises.push(
          plugin.destroy().catch(error => {
            this.eventEmitter.emit('plugin:error', {
              plugin: name,
              error: `Failed to destroy plugin: ${error instanceof Error ? error.message : String(error)}`
            });
            // Don't rethrow, just log the error and continue with other plugins
          })
        );
      }
    }

    await Promise.all(destroyPromises);
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): SHCPlugin | undefined {
    const plugin = this.plugins.get(name);
    
    if (!plugin || !this.isPluginEnabled(name)) {
      return undefined;
    }
    
    return plugin;
  }

  /**
   * List all registered plugins
   */
  listPlugins(): SHCPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => 
      this.isPluginEnabled(plugin.name)
    );
  }

  /**
   * Check if a plugin is enabled
   */
  isPluginEnabled(name: string): boolean {
    return this.enabledPlugins.has(name);
  }

  /**
   * Load a plugin from an npm package
   */
  async loadFromNpm(packageName: string, version?: string): Promise<void> {
    try {
      const plugin = await this.loadPluginFromPackage(packageName, version);
      this.register(plugin);
    } catch (error) {
      throw new Error(`Failed to load plugin from npm: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a plugin from a local path
   */
  async loadFromPath(pluginPath: string): Promise<void> {
    try {
      const plugin = await this.loadPluginFromLocalPath(pluginPath);
      this.register(plugin);
    } catch (error) {
      throw new Error(`Failed to load plugin from path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a plugin from a git repository
   */
  async loadFromGit(url: string, ref?: string): Promise<void> {
    try {
      const plugin = await this.loadPluginFromGit(url, ref);
      this.register(plugin);
    } catch (error) {
      throw new Error(`Failed to load plugin from git: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a plugin from an npm package
   * @private
   */
  private async loadPluginFromPackage(packageName: string, version?: string): Promise<SHCPlugin> {
    try {
      // In a real implementation, this would use a package manager to install the package
      // For now, we'll just try to require the package if it's already installed
      const packageId = version ? `${packageName}@${version}` : packageName;
      
      // This is a simplified implementation for demonstration purposes
      // In a real implementation, this would use dynamic import or require
      const plugin = await this.mockLoadPlugin(packageId);
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from package ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a plugin from a local path
   * @private
   */
  private async loadPluginFromLocalPath(pluginPath: string): Promise<SHCPlugin> {
    try {
      // Resolve the absolute path
      const absolutePath = path.isAbsolute(pluginPath) 
        ? pluginPath 
        : path.resolve(process.cwd(), pluginPath);
      
      // This is a simplified implementation for demonstration purposes
      // In a real implementation, this would use dynamic import or require
      const plugin = await this.mockLoadPlugin(absolutePath);
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from path ${pluginPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a plugin from a git repository
   * @private
   */
  private async loadPluginFromGit(url: string, ref?: string): Promise<SHCPlugin> {
    try {
      // In a real implementation, this would clone the git repository and install it
      // For now, we'll just simulate the process
      const gitId = ref ? `${url}#${ref}` : url;
      
      // This is a simplified implementation for demonstration purposes
      const plugin = await this.mockLoadPlugin(gitId);
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from git ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Mock loading a plugin for testing purposes
   * In a real implementation, this would be replaced with actual dynamic loading
   * @private
   */
  private async mockLoadPlugin(id: string): Promise<SHCPlugin> {
    // This is a mock implementation for testing
    // In a real implementation, this would use dynamic import or require
    
    // Simulate some delay for async loading
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create a mock plugin based on the ID
    const plugin: SHCPlugin = {
      name: `plugin-${id.replace(/[@/\\:]/g, '-')}`,
      version: '1.0.0',
      type: 'request-preprocessor' as any,
      execute: async () => {
        return { success: true };
      },
      initialize: async () => {
        // Initialization logic would go here
      },
      destroy: async () => {
        // Cleanup logic would go here
      },
      configure: async (config: any) => {
        // Configuration logic would go here
      }
    };
    
    return plugin;
  }
}

/**
 * Create a new PluginManager instance
 */
export const createPluginManager = (options?: {
  configManager?: ConfigManagerImpl;
}): IPluginManager => {
  return new PluginManagerImpl(options);
};
