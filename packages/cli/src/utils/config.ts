/**
 * Configuration utilities for the CLI package.
 * These utilities handle configuration loading, path resolution, and integration
 * with the core package's ConfigManager.
 */
import path from 'path';
import os from 'os';
import { ConfigManager } from '@shc/core';

// Export for testing purposes
export const configManagerFactory = () => new ConfigManager();

/**
 * Get effective options by merging CLI options with config file settings.
 * This function loads configuration from a file if specified and merges it with
 * the provided CLI options, with CLI options taking precedence.
 * 
 * @param options - CLI options from Commander
 * @param createConfigManager - Factory function for creating a ConfigManager instance (for testing)
 * @returns A merged configuration object with CLI options taking precedence
 */
export async function getEffectiveOptions(
  options: Record<string, unknown>,
  createConfigManager = configManagerFactory
): Promise<Record<string, unknown>> {
  const configPath = options.config as string;
  let configManager = createConfigManager();

  if (configPath) {
    try {
      await configManager.loadFromFile(configPath);
      console.log(`Config loaded from: ${configPath}`);
    } catch (error) {
      console.error(
        `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
      );
      // Initialize with default config if loading fails
      configManager = createConfigManager();
    }
  }

  // Convert the config to a plain object
  const configData: Record<string, unknown> = {};

  // Extract core settings
  configData.core = configManager.get('core');

  // Extract storage settings
  configData.storage = configManager.get('storage');

  // Extract variable sets
  configData.variable_sets = configManager.get('variable_sets');

  // Extract plugins configuration
  configData.plugins = configManager.get('plugins');

  // Merge config with CLI options (CLI options take precedence)
  return {
    ...configData,
    ...options,
  };
}

/**
 * Get the collection directory path based on options.
 * This function resolves the collection directory path according to the following rules:
 * 1. If collectionDir is specified in options, use that
 * 2. If collectionDir is a relative path and config file is specified, resolve relative to config file directory
 * 3. If collectionDir is a relative path and no config file is specified, resolve relative to current working directory
 * 
 * @param options - CLI options containing collectionDir and possibly config
 * @returns The resolved absolute path to the collection directory
 */
export function getCollectionDir(options: Record<string, unknown>): string {
  // If collectionDir is specified in options, use that
  if (options.collectionDir) {
    const collectionDir = options.collectionDir as string;
    
    // If it's an absolute path, use it directly
    if (path.isAbsolute(collectionDir)) {
      return collectionDir;
    }
    
    // If config file is specified, resolve relative to config file directory
    if (options.config) {
      const configDir = path.dirname(options.config as string);
      return path.resolve(configDir, collectionDir);
    }
    
    // Otherwise, resolve relative to current working directory
    return path.resolve(process.cwd(), collectionDir);
  }

  // Default to storage.collections.path from config, or ./collections if not specified
  return path.resolve(process.cwd(), './collections');
}

/**
 * Create a ConfigManager instance from CLI options.
 * This function creates a ConfigManager instance, loads configuration from a file if specified,
 * and applies CLI options to override config values.
 * 
 * @param options - CLI options from Commander
 * @param createConfigManager - Factory function for creating a ConfigManager instance (for testing)
 * @returns A configured ConfigManager instance
 */
export async function createConfigManagerFromOptions(
  options: Record<string, unknown>,
  createConfigManager = configManagerFactory
): Promise<ConfigManager> {
  const configManager = createConfigManager();
  
  // Load config file if specified
  if (options.config) {
    try {
      await configManager.loadFromFile(options.config as string);
    } catch (error) {
      console.error(
        `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  // Apply CLI options to override config values
  if (options.collectionDir) {
    configManager.set('storage.collections.path', options.collectionDir);
  }
  
  if (options.timeout) {
    configManager.set('core.http.timeout', options.timeout);
  }
  
  return configManager;
}

// Removed createClientConfig function as it duplicates functionality
// that should be handled by the core package's ConfigManager.
// Use createConfigManagerFromOptions instead for proper configuration management.
