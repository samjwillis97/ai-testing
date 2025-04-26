import { EventEmitter } from 'events';
import path from 'path';
import pacote from 'pacote';
import { PluginManager as IPluginManager } from '../types/plugin-manager.types';
import { SHCPlugin, PluginConfig } from '../types/plugin.types';
import { ConfigManagerImpl } from '../config-manager';
import simpleGit from 'simple-git';

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
      const pluginsDir = path.resolve(process.cwd(), 'plugins');
      await import('fs/promises').then(fs => fs.mkdir(pluginsDir, { recursive: true }));
      const pkgSpecifier = version ? `${packageName}@${version}` : packageName;
      const extractDir = path.join(pluginsDir, packageName.replace(/\//g, '_'));
      await import('fs/promises').then(fs => fs.rm(extractDir, { recursive: true, force: true }));
      await pacote.extract(pkgSpecifier, extractDir);
      // Recursively extract dependencies
      let pkgJson;
      try {
        const packageJsonPath = path.join(extractDir, 'package.json');
        pkgJson = await import(packageJsonPath).then(module => module.default || module);
        await this.extractDependencies(pkgJson, extractDir);
      } catch (importError) {
        // Continue without package.json
        console.warn(`Could not load package.json for ${packageName}: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
      // Dynamically import the plugin entry
      let entry;
      try {
        entry = pkgJson && pkgJson.main ? path.join(extractDir, pkgJson.main) : path.join(extractDir, 'index.js');
      } catch {
        entry = path.join(extractDir, 'index.js');
      }
      const imported = await import(entry);
      const plugin = imported.default || imported;
      if (!plugin || typeof plugin !== 'object') throw new Error('Invalid plugin export');
      return plugin as SHCPlugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from package ${packageName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Recursively extract all dependencies using pacote
   * @private
   */
  private async extractDependencies(pkgJson: Record<string, unknown>, targetDir: string) {
    const deps = Object.assign({}, (pkgJson.dependencies ?? {}), (pkgJson.optionalDependencies ?? {}));
    if (!deps || Object.keys(deps).length === 0) return;
    const nodeModulesDir = path.join(targetDir, 'node_modules');
    await import('fs/promises').then(fs => fs.mkdir(nodeModulesDir, { recursive: true }));
    for (const [dep, ver] of Object.entries(deps)) {
      const depDir = path.join(nodeModulesDir, dep.replace(/\//g, '_'));
      await import('fs/promises').then(fs => fs.rm(depDir, { recursive: true, force: true }));
      await pacote.extract(`${dep}@${ver}`, depDir);
      // Recursively extract subdependencies
      let subPkgJson: Record<string, unknown> | undefined;
      try {
        const subPackageJsonPath = path.join(depDir, 'package.json');
        subPkgJson = await import(subPackageJsonPath).then(module => module.default || module);
      } catch (importError) {
        // Continue without sub-package.json
        console.warn(`Could not load sub-package.json for ${dep}: ${importError instanceof Error ? importError.message : String(importError)}`);
        continue;
      }
      if (subPkgJson) {
        await this.extractDependencies(subPkgJson, depDir);
      }
    }
  }

  /**
   * Load a plugin from a local path
   * @private
   */
  private async loadPluginFromLocalPath(pluginPath: string): Promise<SHCPlugin> {
    try {
      // Resolve absolute path
      const absolutePath = path.isAbsolute(pluginPath)
        ? pluginPath
        : path.resolve(process.cwd(), pluginPath);
      // Dynamically import the plugin
      const imported = await import(absolutePath);
      const plugin = imported.default || imported;
      if (!plugin || typeof plugin !== 'object') throw new Error('Invalid plugin export');
      return plugin as SHCPlugin;
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
      const pluginsDir = path.resolve(process.cwd(), 'plugins');
      await import('fs/promises').then(fs => fs.mkdir(pluginsDir, { recursive: true }));
      const repoName = url.split('/').pop()?.replace(/\.git$/, '') || 'git-plugin';
      const targetDir = path.join(pluginsDir, `${repoName}-${Date.now()}`);
      // Use simple-git for cloning
      try {
        await simpleGit().clone(url, targetDir);
        if (ref) {
          await simpleGit(targetDir).checkout(ref);
        }
      } catch (err) {
        throw new Error(`Could not clone git repo with simple-git. Ensure git is available in the environment or provide guidance. Details: ${err instanceof Error ? err.message : String(err)}`);
      }
      // Install dependencies using pacote-based extraction
      let pkgJson;
      try {
        const packageJsonPath = path.join(targetDir, 'package.json');
        pkgJson = await import(packageJsonPath).then(module => module.default || module);
        await this.extractDependencies(pkgJson, targetDir);
      } catch (importError) {
        // Continue without package.json
        console.warn(`Could not load package.json for git repo ${url}: ${importError instanceof Error ? importError.message : String(importError)}`);
      }
      // Dynamically import the plugin (assume main entry in package.json or index.js)
      let entry;
      try {
        entry = pkgJson && pkgJson.main ? path.join(targetDir, pkgJson.main) : path.join(targetDir, 'index.js');
      } catch {
        entry = path.join(targetDir, 'index.js');
      }
      const imported = await import(entry);
      const plugin = imported.default || imported;
      if (!plugin || typeof plugin !== 'object') throw new Error('Invalid plugin export');
      return plugin as SHCPlugin;
    } catch (error) {
      throw new Error(`Failed to load plugin from git ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
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
