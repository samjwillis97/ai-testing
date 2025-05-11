/**
 * Configuration utilities for the CLI package.
 * These utilities handle configuration loading, path resolution, and integration
 * with the core package's ConfigManager.
 */
import { ConfigManager } from '@shc/core';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import yaml from 'js-yaml';
import { Logger } from './logger.js';

// Singleton instance of ConfigManager
let configManagerInstance: ConfigManager | null = null;
let configManagerInitialized = false;
let configManagerInitializing = false;
let pendingInitPromise: Promise<ConfigManager> | null = null;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Map of collection paths to loaded status with timestamp
interface LoadedCollectionInfo {
  loaded: boolean;
  timestamp: number;
}

const loadedCollectionPaths = new Map<string, LoadedCollectionInfo>();

/**
 * Get the shared ConfigManager instance
 * If an instance already exists, it will be returned
 * Otherwise, a new instance will be created and initialized with the provided options
 * 
 * @param options Options to initialize the ConfigManager with
 * @returns The shared ConfigManager instance
 */
export async function getConfigManager(options?: Record<string, unknown>): Promise<ConfigManager> {
  // If we already have a fully initialized instance and no new options, return it immediately
  if (configManagerInitialized && configManagerInstance && !options) {
    Logger.getInstance().debug('Returning cached ConfigManager instance');
    return configManagerInstance;
  }
  
  // If initialization is in progress, return the pending promise to avoid duplicate work
  if (configManagerInitializing && pendingInitPromise) {
    Logger.getInstance().debug('Waiting for ConfigManager initialization');
    return pendingInitPromise;
  }
  
  // Start initialization
  configManagerInitializing = true;
  Logger.getInstance().debug('Initializing ConfigManager');
  
  // Create a new promise for initialization
  pendingInitPromise = (async () => {
    try {
      const configManager = new ConfigManager();
      
      // Load config file if specified via CLI options
      if (options && options.config) {
        try {
          await configManager.loadFromFile(options.config as string);
        } catch (error) {
          Logger.getInstance().error(
            `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
      
      // Update singleton state
      configManagerInstance = configManager;
      configManagerInitialized = true;
      return configManager;
    } catch (error) {
      // Reset initialization state on error
      configManagerInitializing = false;
      throw error;
    } finally {
      // Reset initialization flag
      configManagerInitializing = false;
      pendingInitPromise = null;
    }
  })();
  
  return pendingInitPromise;
}

/**
 * Check if a collection path needs to be reloaded based on cache timestamp
 * @param normalizedPath Normalized collection path
 * @returns True if the path should be reloaded, false otherwise
 */
function shouldReloadCollections(normalizedPath: string): boolean {
  const info = loadedCollectionPaths.get(normalizedPath);
  if (!info) return true;
  
  const now = Date.now();
  return now - info.timestamp > CACHE_TTL_MS;
}

/**
 * Manually load collections from a directory to handle potential EISDIR errors
 * @param configManager ConfigManager instance
 * @param collectionDir Collection directory path
 * @param logger Optional logger instance
 */
async function manuallyLoadCollections(
  configManager: ConfigManager,
  collectionDir: string,
  logger?: Logger
): Promise<void> {
  try {
    // Check if the directory exists
    try {
      await fsPromises.access(collectionDir);
    } catch (error) {
      // Directory doesn't exist, just log and return
      if (logger) logger.debug(`Collection directory does not exist: ${collectionDir}`);
      return; // No collections to load
    }
    
    // Check if the path is a directory
    const stats = await fsPromises.stat(collectionDir);
    if (!stats.isDirectory()) {
      throw new Error(`Collection path is not a directory: ${collectionDir}`);
    }
    
    // Read all files in the directory
    const files = await fsPromises.readdir(collectionDir);
    
    // Filter for collection files
    const collectionFiles = files.filter(file => 
      file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
    );
    
    // Initialize collections in config if needed
    const config = (configManager as any).config || {};
    config.collections = config.collections || { items: [] };
    config.collections.items = config.collections.items || [];
    
    // Load each collection file using the new loadCollectionFromFile method
    for (const file of collectionFiles) {
      try {
        const filePath = path.join(collectionDir, file);
        
        // Check if the file is a regular file
        const fileStats = await fsPromises.stat(filePath);
        if (!fileStats.isFile()) {
          if (logger) logger.debug(`Skipping non-file: ${filePath}`);
          continue;
        }
        
        try {
          // Use the new loadCollectionFromFile method to load the collection
          await configManager.loadCollectionFromFile(filePath);
          if (logger) logger.debug(`Loaded collection from file: ${filePath}`);
        } catch (loadError) {
          // If the new method fails, fall back to manual loading
          if (logger) logger.warn(`Failed to load collection using loadCollectionFromFile: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
          
          // Read and parse the file manually
          const content = await fsPromises.readFile(filePath, 'utf8');
          let collection;
          
          try {
            if (file.endsWith('.json')) {
              collection = JSON.parse(content);
            } else {
              collection = yaml.load(content);
            }
          } catch (parseError) {
            if (logger) logger.warn(`Failed to parse collection file ${file}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            continue;
          }
          
          // Add the collection to the config if it's valid
          if (collection && typeof collection === 'object' && 'name' in collection) {
            // Add metadata to the collection
            collection.metadata = collection.metadata || {};
            collection.metadata.filePath = filePath;
            collection.metadata.fileName = file;
            
            // Check if the collection already exists
            const existingIndex = config.collections.items.findIndex(
              (c: any) => c.name === collection.name
            );
            
            if (existingIndex >= 0) {
              // Update existing collection
              config.collections.items[existingIndex] = collection;
              if (logger) logger.debug(`Updated collection: ${collection.name}`);
            } else {
              // Add new collection
              config.collections.items.push(collection);
              if (logger) logger.debug(`Added collection: ${collection.name}`);
            }
          } else {
            if (logger) logger.warn(`Invalid collection in file ${file}: missing name property`);
          }
        }
      } catch (error) {
        if (logger) logger.warn(`Failed to process collection file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other collections even if one fails
      }
    }
    
    // Store the collection directory in the config
    config.collections.directories = config.collections.directories || [];
    if (!config.collections.directories.includes(collectionDir)) {
      config.collections.directories.push(collectionDir);
    }
    
    // Update the configManager's config
    (configManager as any).config = config;
    
  } catch (error) {
    if (logger) logger.error(`Failed to manually load collections: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Ensure collections are loaded for a specific path
 * @param configManager ConfigManager instance
 * @param collectionDir Collection directory path
 * @param logger Optional logger instance
 * @param force Force reload collections even if they've already been loaded
 */
export async function ensureCollectionsLoaded(
  configManager: ConfigManager,
  collectionDir: string,
  logger?: Logger,
  force = false
): Promise<void> {
  // Normalize the path to ensure consistent keys in the map
  const normalizedPath = path.normalize(collectionDir);
  
  // Check if we need to reload based on cache
  const info = loadedCollectionPaths.get(normalizedPath);
  if (!force && info && !shouldReloadCollections(normalizedPath)) {
    if (logger) logger.debug(`Using cached collections for ${normalizedPath}`);
    return;
  }
  
  if (logger) logger.debug(`Loading collections from path: ${normalizedPath}`);
  
  // Add the collection path to the directories array
  const currentDirectories = configManager.get<string[]>('collections.directories', []);
  if (!currentDirectories.includes(normalizedPath)) {
    configManager.set('collections.directories', [...currentDirectories, normalizedPath]);
  }
  
  try {
    // Always use our manual loading method to avoid EISDIR errors
    if (logger) logger.debug(`Using manual loading for collections in ${normalizedPath}`);
    await manuallyLoadCollections(configManager, normalizedPath, logger);
    
    // Mark this path as loaded with current timestamp
    loadedCollectionPaths.set(normalizedPath, {
      loaded: true,
      timestamp: Date.now()
    });
  } catch (error) {
    if (logger) logger.error(
      `Failed to load collections: ${error instanceof Error ? error.message : String(error)}`
    );
    throw error;
  }
}

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns Promise that resolves to true if the file exists, false otherwise
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a ConfigManager instance from options
 * @param options Options for the ConfigManager
 * @returns A new ConfigManager instance
 */
export async function createConfigManagerFromOptions(options: Record<string, unknown>): Promise<ConfigManager> {
  const configManager = await getConfigManager(options);
  return configManager;
}

/**
 * Parse variable set overrides from CLI options
 * @param varSetOverrides Array of variable set overrides in the format "namespace=value"
 * @returns Object mapping namespaces to values
 */
export function parseVariableSetOverrides(varSetOverrides: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const override of varSetOverrides) {
    const [namespace, value] = override.split('=');
    if (namespace && value) {
      result[namespace.trim()] = value.trim();
    }
  }
  
  return result;
}

/**
 * Apply variable set overrides to the ConfigManager
 * @param configManager ConfigManager instance
 * @param varSetOverrides Object mapping namespaces to values
 * @param requestSpecific Whether these overrides are for a specific request
 */
export function applyVariableSetOverrides(
  configManager: ConfigManager,
  varSetOverrides: Record<string, string>,
  requestSpecific = false
): void {
  // Get existing variable sets or create empty object
  const variableSets = configManager.get('variableSets', {}) as Record<string, Record<string, string>>;
  
  // Apply each override
  for (const [namespace, value] of Object.entries(varSetOverrides)) {
    // Create namespace if it doesn't exist
    if (!variableSets[namespace]) {
      variableSets[namespace] = {};
    }
    
    // Split the value into key-value pairs if it contains commas
    if (value.includes(',')) {
      const pairs = value.split(',');
      for (const pair of pairs) {
        const [key, val] = pair.split(':');
        if (key && val) {
          variableSets[namespace][key.trim()] = val.trim();
        }
      }
    } else if (value.includes(':')) {
      // Single key-value pair
      const [key, val] = value.split(':');
      if (key && val) {
        variableSets[namespace][key.trim()] = val.trim();
      }
    } else {
      // Just a value, create a default key
      variableSets[namespace] = { value: value };
    }
  }
  
  // Update the config
  if (requestSpecific) {
    configManager.set('requestVariableSets', variableSets);
  } else {
    configManager.set('variableSets', variableSets);
  }
}

/**
 * Get effective options by merging CLI options with config file settings.
 * This function loads configuration from a file if specified and merges it with
 * the provided CLI options, with CLI options taking precedence.
 *
 * @param options - CLI options from Commander
 * @returns A merged configuration object with CLI options taking precedence
 */
export async function getEffectiveOptions(
  options: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const configPath = options.config as string;
  let configManager = await getConfigManager();

  if (configPath) {
    try {
      await configManager.loadFromFile(configPath);
    } catch (error) {
      Logger.getInstance().error(
        `Failed to load config file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Get all config values - use a different approach since getAll() doesn't exist
  const configValues: Record<string, unknown> = {};
  // Get common config values that might be needed
  configValues.baseUrl = configManager.get('baseUrl', '');
  configValues.timeout = configManager.get('timeout', 30000);
  configValues.headers = configManager.get('headers', {});
  configValues.auth = configManager.get('auth', {});
  
  // Merge with CLI options, with CLI options taking precedence
  return { ...configValues, ...options };
}

/**
 * Get the collection directory path based on options.
 * This function uses the ConfigManager from the core package to resolve the collection directory path.
 * 
 * @param options - CLI options containing collectionDir and possibly config
 * @returns The resolved absolute path to the collection directory
 */
export async function getCollectionDir(options: Record<string, unknown>): Promise<string> {
  // If collection directory is explicitly specified in options, use it
  if (options.collectionDir) {
    const collectionDir = options.collectionDir as string;
    if (path.isAbsolute(collectionDir)) {
      return collectionDir;
    }
    
    // Resolve relative path against current working directory
    return path.resolve(process.cwd(), collectionDir);
  }
  
  // Get logger for debugging
  const logger = Logger.getInstance();
  
  // For development and testing, prioritize the local collections directory if it exists
  const localCollectionDir = path.join(process.cwd(), 'collections');
  try {
    // Check if the local directory exists and has collection files
    const exists = await fileExists(localCollectionDir);
    if (exists) {
      const files = await fsPromises.readdir(localCollectionDir);
      const collectionFiles = files.filter(file => 
        file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
      );
      
      if (collectionFiles.length > 0) {
        logger.debug(`Using collections from local directory: ${localCollectionDir}`);
        return localCollectionDir;
      }
    }
  } catch (error) {
    // Ignore errors and fall back to other methods
    logger.debug(`Error checking local directory: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Next check the user's config directory
  const userConfigDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'shc', 'collections');
  try {
    // Check if the user config directory exists and has collection files
    const exists = await fileExists(userConfigDir);
    if (exists) {
      const files = await fsPromises.readdir(userConfigDir);
      const collectionFiles = files.filter(file => 
        file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
      );
      
      if (collectionFiles.length > 0) {
        logger.debug(`Using collections from user config directory: ${userConfigDir}`);
        return userConfigDir;
      }
    }
  } catch (error) {
    // Ignore errors and fall back to other methods
    logger.debug(`Error checking user config directory: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // If no collections found yet, use the ConfigManager to get the configured path
  const configManager = await getConfigManager(options);
  const configDirectories = configManager.get<string[]>('collections.directories', []);
  
  if (configDirectories && configDirectories.length > 0) {
    // Use the first directory in the array
    logger.debug(`Using collections from config: ${configDirectories[0]}`);
    return configDirectories[0];
  }
  
  // Fall back to default path in user's home directory
  logger.debug(`Falling back to default user config directory: ${userConfigDir}`);
  return userConfigDir;
}
