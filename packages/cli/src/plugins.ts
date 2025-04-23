import { Plugin } from '@shc/core';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

export interface PluginConfig {
  name: string;
  config?: Record<string, unknown>;
  type?: 'package' | 'file';
}

/**
 * Load a plugin from a module or file
 * @param pluginConfig The plugin configuration
 * @returns The loaded plugin instance or null if loading fails
 */
export async function loadPlugin(pluginConfig: PluginConfig): Promise<Plugin> {
  try {
    let modulePath = pluginConfig.name;

    // Handle file-based plugins
    if (pluginConfig.type === 'file' || modulePath.startsWith('file:')) {
      // Remove 'file:' prefix if present
      modulePath = modulePath.replace(/^file:/, '');
      
      // Resolve path relative to current working directory
      modulePath = resolve(process.cwd(), modulePath);
    }

    const pluginModule = await import(modulePath);
    const plugin = createPluginInstance(pluginModule, pluginConfig);
    if (!plugin) {
      throw new Error(`Invalid plugin format in module ${pluginConfig.name}`);
    }
    return plugin;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to load plugin ${pluginConfig.name}: ${error.message}`);
    }
    throw new Error(`Failed to load plugin ${pluginConfig.name}: Unknown error`);
  }
}

/**
 * Create a plugin instance from a loaded module
 * @param pluginModule The loaded plugin module
 * @param pluginConfig The plugin configuration
 * @returns The plugin instance
 */
function createPluginInstance(pluginModule: unknown, pluginConfig: PluginConfig): Plugin | null {
  // If the module exports a class with a constructor
  if (typeof pluginModule === 'object' && 
      pluginModule !== null && 
      'default' in pluginModule &&
      typeof pluginModule.default === 'function' &&
      'prototype' in pluginModule.default) {
    const DefaultClass = (pluginModule as { default: new (config: Record<string, unknown>) => Plugin }).default;
    return new DefaultClass(pluginConfig.config ?? {});
  }
  
  // If the module exports a factory function
  if (typeof pluginModule === 'object' && 
      pluginModule !== null && 
      'createPlugin' in pluginModule &&
      typeof pluginModule.createPlugin === 'function') {
    return (pluginModule as { createPlugin: (config: Record<string, unknown>) => Plugin })
      .createPlugin(pluginConfig.config ?? {});
  }

  // If the module exports a plugin object directly
  if (typeof pluginModule === 'object' && 
      pluginModule !== null && 
      'default' in pluginModule &&
      typeof pluginModule.default === 'object' && 
      pluginModule.default !== null &&
      'name' in pluginModule.default) {
    return pluginModule.default as Plugin;
  }

  return null;
} 