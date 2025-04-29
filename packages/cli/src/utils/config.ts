/**
 * Configuration utilities
 */
import path from 'path';
import os from 'os';
import { ConfigManager } from '@shc/core';

// Export for testing purposes
export const configManagerFactory = () => new ConfigManager();

/**
 * Get effective options by merging CLI options with config file
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
 * Get collection directory path
 */
export async function getCollectionDir(options: Record<string, unknown>): Promise<string> {
  let collectionDir: string;

  // CLI option takes precedence
  if (options.collectionDir) {
    collectionDir = options.collectionDir as string;
  }
  // Check if storage.collections.path is defined in the config
  else if (
    options.storage &&
    typeof options.storage === 'object' &&
    (options.storage as Record<string, unknown>).collections &&
    typeof (options.storage as Record<string, unknown>).collections === 'object' &&
    ((options.storage as Record<string, unknown>).collections as Record<string, unknown>).path
  ) {
    collectionDir = (
      (options.storage as Record<string, unknown>).collections as Record<string, unknown>
    ).path as string;
  }
  // Default to ~/.shc/collections
  else {
    const homeDir = os.homedir();
    collectionDir = path.join(homeDir, '.shc', 'collections');
  }

  // If the path is relative, resolve it relative to the config file location or current directory
  if (!path.isAbsolute(collectionDir)) {
    // If we have a config file path, resolve relative to that
    if (options.config && typeof options.config === 'string') {
      const configDir = path.dirname(path.resolve(options.config as string));
      collectionDir = path.resolve(configDir, collectionDir);
    } else {
      // Otherwise resolve relative to current working directory
      collectionDir = path.resolve(process.cwd(), collectionDir);
    }
  }

  return collectionDir;
}

/**
 * Create a ConfigManager instance from CLI options
 */
export async function createConfigManagerFromOptions(
  options: Record<string, unknown>,
  createConfigManager = configManagerFactory
): Promise<ConfigManager> {
  const configManager = createConfigManager();
  const configPath = options.config as string;

  if (configPath) {
    try {
      await configManager.loadFromFile(configPath);
      console.log(`Config loaded from: ${configPath}`);
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
