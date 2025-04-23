import { exec } from 'child_process';
import { promisify } from 'util';
import { SHCPlugin, PluginConfig, PluginType } from '../types/plugin';

const execAsync = promisify(exec);

export class PluginLoadError extends Error {
  constructor(
    public readonly pluginName: string,
    public readonly pluginType: PluginType,
    message: string,
    public readonly cause?: Error
  ) {
    super(`Failed to load plugin ${pluginName}: ${message}`);
    this.name = 'PluginLoadError';
  }
}

export class PluginManager {
  private plugins: Map<string, SHCPlugin> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();

  constructor(
    private readonly options: {
      packageManager: 'npm' | 'pnpm' | 'yarn';
      pluginsDir: string;
    },
    private readonly importModule: (path: string) => Promise<any> = (path) => import(path)
  ) {}

  /**
   * Load a plugin from its configuration
   */
  public async loadPlugin(config: PluginConfig): Promise<SHCPlugin> {
    try {
      // Check if plugin is already loaded
      if (this.plugins.has(config.name)) {
        return this.plugins.get(config.name)!;
      }

      // Install plugin if needed
      await this.installPlugin(config);

      // Import plugin
      const plugin = await this.importPlugin(config);

      // Validate plugin interface
      this.validatePlugin(plugin);

      // Initialize plugin
      if (plugin.initialize) {
        await plugin.initialize();
      }

      // Store plugin and config
      this.plugins.set(config.name, plugin);
      this.pluginConfigs.set(config.name, config);

      return plugin;
    } catch (error) {
      throw new PluginLoadError(
        config.name,
        (error as any).pluginType || 'unknown',
        (error as Error).message,
        error as Error
      );
    }
  }

  /**
   * Install a plugin using the configured package manager
   */
  private async installPlugin(config: PluginConfig): Promise<void> {
    if (config.package) {
      // Install from npm
      const packageSpec = config.version 
        ? `${config.package}@${config.version}`
        : config.package;
      
      await execAsync(`${this.options.packageManager} install ${packageSpec}`);
    } else if (config.path) {
      // Install from local path
      await execAsync(`${this.options.packageManager} install ${config.path}`);
    } else if (config.git) {
      // Install from git
      const gitSpec = config.ref 
        ? `${config.git}#${config.ref}`
        : config.git;
      
      await execAsync(`${this.options.packageManager} install ${gitSpec}`);
    }
  }

  /**
   * Import a plugin module
   */
  private async importPlugin(config: PluginConfig): Promise<SHCPlugin> {
    let modulePath: string;

    if (config.package) {
      modulePath = config.package;
    } else if (config.path) {
      modulePath = config.path;
    } else if (config.git) {
      // For git installations, we need to determine the installed package name
      // This is a simplified version - you might need more robust logic
      modulePath = config.name;
    } else {
      throw new Error('No valid plugin source specified');
    }

    const module = await this.importModule(modulePath);
    return module.default as SHCPlugin;
  }

  /**
   * Validate that a plugin implements the required interface
   */
  private validatePlugin(plugin: any): void {
    if (!plugin) {
      throw new Error('Plugin is undefined');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a name string');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a version string');
    }

    if (!plugin.type || !Object.values(PluginType).includes(plugin.type)) {
      throw new Error('Plugin must have a valid type');
    }

    if (!plugin.execute || typeof plugin.execute !== 'function') {
      throw new Error('Plugin must have an execute function');
    }

    if (plugin.initialize && typeof plugin.initialize !== 'function') {
      throw new Error('Plugin initialize must be a function if provided');
    }

    if (plugin.destroy && typeof plugin.destroy !== 'function') {
      throw new Error('Plugin destroy must be a function if provided');
    }
  }

  /**
   * Get a loaded plugin by name
   */
  public getPlugin(name: string): SHCPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all loaded plugins of a specific type
   */
  public getPluginsByType(type: PluginType): SHCPlugin[] {
    return Array.from(this.plugins.values()).filter(plugin => plugin.type === type);
  }

  /**
   * Unload a plugin by name
   */
  public async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return;
    }

    if (plugin.destroy) {
      await plugin.destroy();
    }

    this.plugins.delete(name);
    this.pluginConfigs.delete(name);
  }

  /**
   * Unload all plugins
   */
  public async unloadAllPlugins(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    await Promise.all(pluginNames.map(name => this.unloadPlugin(name)));
  }
} 