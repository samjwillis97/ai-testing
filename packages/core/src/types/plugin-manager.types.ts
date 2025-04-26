import { SHCPlugin, PluginConfig } from './plugin.types';

/**
 * Interface for the Plugin Manager
 * Manages plugin registration, lifecycle, and loading
 */
export interface PluginManager {
  // Register plugins
  register(plugin: SHCPlugin): void;
  registerFromConfig(config: PluginConfig): Promise<void>;
  
  // Plugin lifecycle management
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  
  // Plugin utilities
  getPlugin(name: string): SHCPlugin | undefined;
  listPlugins(): SHCPlugin[];
  isPluginEnabled(name: string): boolean;
  
  // Dynamic loading
  loadFromNpm(packageName: string, version?: string): Promise<void>;
  loadFromPath(path: string): Promise<void>;
  loadFromGit(url: string, ref?: string): Promise<void>;
}

// No 'any' usage detected in PluginManager interface. No changes needed.
