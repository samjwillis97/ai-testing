/**
 * Collection management utilities
 * This file provides a wrapper around the core package's ConfigManager
 * for use in the CLI package.
 */
import { ConfigManager, SHCClient } from '@shc/core';
import type { Collection } from '@shc/core';
import type { Response } from '@shc/core';
import { RequestOptions } from '../types.js';
import { getConfigManager, ensureCollectionsLoaded } from './config.js';
import { Logger } from './logger.js';
import { promises as fs } from 'fs';
import path from 'path';

// Define ExecuteOptions type locally
interface ExecuteOptions {
  [key: string]: unknown;
}

/**
 * Request interface with ID and name for CLI display
 */
export interface RequestInfo {
  id: string;
  name: string;
  description?: string;
  method?: string;
}

/**
 * Find a collection by name with case-insensitive matching
 * @param collections Array of collections
 * @param name Collection name to find
 * @returns The found collection or undefined
 */
function findCollection(collections: Collection[], name: string): Collection | undefined {
  return collections.find((c: Collection) => {
    // Try exact match first
    if (c.name === name) return true;
    
    // Try case-insensitive match
    if (c.name.toLowerCase() === name.toLowerCase()) return true;
    
    // Try partial match (case-insensitive)
    if (c.name.toLowerCase().includes(name.toLowerCase())) return true;
    
    // Try matching collection name with spaces removed
    const normalizedName = name.toLowerCase().replace(/\s+/g, '');
    const normalizedCollectionName = c.name.toLowerCase().replace(/\s+/g, '');
    return normalizedCollectionName.includes(normalizedName);
  });
}

/**
 * Find a request by ID or name
 * @param collection Collection containing requests
 * @param name Request ID or name to find
 * @returns The found request or undefined
 */
function findRequest(collection: Collection, name: string): any {
  return collection.requests.find(
    (req: any) => req.id === name || req.name === name
  );
}

// Cache for collection requests
interface RequestCache {
  requests: RequestInfo[];
  timestamp: number;
  collectionName: string;
  path: string;
}

// Request cache with TTL of 5 minutes
let requestsCache: Record<string, RequestCache> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a ConfigManager instance with collections loaded for the specified directory
 * This optimized function reduces redundant config file reads
 * 
 * @param collectionDir Collection directory path
 * @param logger Optional logger instance
 * @returns ConfigManager instance with collections loaded
 */
export async function getConfigWithCollections(
  collectionDir: string,
  logger?: Logger
): Promise<ConfigManager> {
  if (logger) logger.debug(`Getting config with collections from: ${collectionDir}`);
  
  // Get the config manager instance
  const configManager = await getConfigManager();
  
  // Check if the directory exists and has collection files
  try {
    const stats = await fs.stat(collectionDir);
    if (!stats.isDirectory()) {
      if (logger) logger.error(`Collection path is not a directory: ${collectionDir}`);
      throw new Error(`Collection path is not a directory: ${collectionDir}`);
    }
    
    // Read the directory to find collection files
    const files = await fs.readdir(collectionDir);
    const collectionFiles = files.filter((file: string) => 
      file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
    );
    
    if (logger) logger.debug(`Found ${collectionFiles.length} collection files in ${collectionDir}: ${collectionFiles.join(', ')}`);
    
    // Load each collection file individually using the new loadCollectionFromFile method
    for (const file of collectionFiles) {
      try {
        const filePath = path.join(collectionDir, file);
        if (logger) logger.debug(`Loading collection file: ${filePath}`);
        
        // Check if the file is a regular file
        const fileStats = await fs.stat(filePath);
        if (!fileStats.isFile()) {
          if (logger) logger.debug(`Skipping non-file: ${filePath}`);
          continue;
        }
        
        // Load the collection file directly
        await configManager.loadCollectionFromFile(filePath);
        if (logger) logger.debug(`Successfully loaded collection from file: ${filePath}`);
      } catch (error) {
        if (logger) logger.warn(`Failed to load collection file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other files even if one fails
      }
    }
  } catch (error) {
    if (logger) logger.error(`Failed to get ConfigManager with collections: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
  
  // Return the config manager with collections loaded
  return configManager;
}

/**
 * Get available collections
 * @param collectionDir Collection directory path
 * @param logger Optional logger instance
 * @returns Array of collection names
 */
export async function getCollections(
  collectionDir: string,
  logger?: Logger
): Promise<string[]> {
  try {
    // Get the config manager with collections loaded
    const configManager = await getConfigWithCollections(collectionDir, logger);
    
    // Get collections from the config
    const collections = configManager.get<Collection[]>('collections.items', []);
    
    // Return collection names
    return collections.map((c: Collection) => c.name);
  } catch (error) {
    if (logger) {
      logger.error(`Failed to get collections: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Return an empty array instead of throwing to make the API more resilient
    return [];
  }
}

/**
 * Get available requests in a collection
 * @param collectionDir Collection directory path
 * @param collectionName Collection name
 * @param logger Optional logger instance
 * @returns Array of request info objects
 */
export async function getRequests(
  collectionDir: string,
  collectionName: string,
  logger?: Logger
): Promise<RequestInfo[]> {
  try {
    // Create a cache key for this collection
    const cacheKey = `${collectionDir}:${collectionName}`;
    
    // Check if we can use the cache
    const now = Date.now();
    const cacheValid = cacheKey in requestsCache && 
                      (now - requestsCache[cacheKey].timestamp) < CACHE_TTL_MS;
                      
    if (cacheValid) {
      if (logger) {
        logger.debug(`Using cached requests for collection '${collectionName}'`);
      }
      return requestsCache[cacheKey].requests;
    }
    
    // Get the config manager with collections loaded
    const configManager = await getConfigWithCollections(collectionDir, logger);
    
    // Get collections from the config
    const collections = configManager.get<Collection[]>('collections.items', []);
    
    // Find the requested collection
    const collection = findCollection(collections, collectionName);
    if (!collection) {
      if (logger) {
        logger.warn(`Collection '${collectionName}' not found`);
      }
      return [];
    }
    
    // Map the requests to the RequestInfo interface for CLI display
    const requests = collection.requests.map((req: any) => ({
      id: req.id,
      name: req.name,
      description: req.description,
      method: req.method,
    }));
    
    // Update the requests cache
    requestsCache[cacheKey] = {
      requests,
      timestamp: now,
      collectionName,
      path: collectionDir
    };
    
    return requests;
  } catch (error) {
    if (logger) {
      logger.error(`Failed to get requests: ${error instanceof Error ? error.message : String(error)}`);
    }
    return [];
  }
}

/**
 * Get request from collection
 * @param collectionDir Collection directory path
 * @param collectionName Collection name
 * @param requestName Request name or ID
 * @param logger Optional logger instance
 * @returns Request options for the CLI
 */
export async function getRequest(
  collectionDir: string,
  collectionName: string,
  requestName: string,
  logger?: Logger
): Promise<RequestOptions> {
  try {
    // Get the config manager with collections loaded
    const configManager = await getConfigWithCollections(collectionDir, logger);
    
    // Get collections from the config
    const collections = configManager.get<Collection[]>('collections.items', []);
    
    // Find the requested collection
    const collection = findCollection(collections, collectionName);
    if (!collection) {
      const error = new Error(`Collection '${collectionName}' not found`);
      if (logger) {
        logger.error(error.message);
      }
      throw error;
    }

    // Find the request by ID or name
    const request = findRequest(collection, requestName);
    if (!request) {
      const error = new Error(`Request '${requestName}' not found in collection '${collection.name}'`);
      if (logger) {
        logger.error(error.message);
      }
      throw error;
    }

    // Handle both baseUrl and base_url naming conventions
    const baseUrl = collection.baseUrl || (collection as any).base_url;
    
    // Convert the core Request type to CLI RequestOptions type
    const requestOptions: RequestOptions = {
      method: request.method || 'GET',
      path: request.path || '',
      headers: request.headers || {},
      query: request.query || {},
      body: request.body || undefined,
      baseUrl: baseUrl, // Use the resolved baseUrl
      authentication: request.authentication || collection.authentication,
    };
    
    // Log the baseUrl for debugging
    if (logger) {
      logger.debug(`Request baseUrl: ${requestOptions.baseUrl || 'not set'}`);
    }
    
    // Ensure we have a baseUrl or a full URL in the path
    if (!requestOptions.baseUrl && requestOptions.path && !requestOptions.path.startsWith('http')) {
      if (logger) {
        logger.warn('No baseUrl found in collection, checking for default baseUrl');
      }
      
      // Try to get a default baseUrl from the config
      const defaultBaseUrl = configManager.get('core.http.default_base_url');
      if (defaultBaseUrl) {
        requestOptions.baseUrl = defaultBaseUrl as string;
        if (logger) {
          logger.debug(`Using default baseUrl: ${defaultBaseUrl}`);
        }
      } else if (request.url) {
        // If there's a url property, use that instead of path
        requestOptions.path = request.url;
        if (logger) {
          logger.debug(`Using request.url: ${request.url}`);
        }
      }
    }

    // Handle body property conversion from core type to CLI type
    if (request.body) {
      // If the body is a string, assume it's JSON
      if (typeof request.body === 'string') {
        try {
          requestOptions.body = {
            type: 'json',
            content: request.body
          };
        } catch (e) {
          // If it's not valid JSON, treat as plain text
          requestOptions.body = {
            type: 'text',
            content: request.body
          };
        }
      }
      // If the body has content and type properties, use those
      else if (typeof request.body === 'object' && request.body !== null) {
        if ('content' in request.body) {
          requestOptions.body = {
            type: (request.body as any).type || 'json',
            content: request.body.content
          };
        }
        // Otherwise, stringify the object
        else {
          requestOptions.body = {
            type: 'json',
            content: JSON.stringify(request.body)
          };
        }
      }
    }
    
    return requestOptions;
  } catch (error) {
    if (logger) {
      logger.error(`Failed to get request: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
}

/**
 * Execute a request from a collection
 * @param collectionDir Collection directory path
 * @param collectionName Collection name
 * @param requestName Request name or ID
 * @param options Additional options for the request
 * @param logger Optional logger instance
 * @returns Response from the request
 */
export async function executeRequest(
  collectionDir: string,
  collectionName: string,
  requestName: string,
  options: ExecuteOptions = {},
  logger?: Logger
): Promise<Response<unknown>> {
  try {
    // Get the request options directly without relying on the core package's loadCollections
    const requestOptions = await getRequest(collectionDir, collectionName, requestName, logger);
    
    // Create a config manager instance without loading collections
    const configManager = await getConfigManager();
    
    if (logger) {
      const url = requestOptions.baseUrl 
        ? `${requestOptions.baseUrl}${requestOptions.path}` 
        : requestOptions.path;
      logger.info(`Executing ${requestOptions.method} request to: ${url}`);
    }
    
    // Create a client instance with a custom event handler to prevent collection loading errors
    const client = SHCClient.create(configManager, {
      eventHandlers: [
        {
          event: 'error',
          handler: (error: unknown) => {
            // Suppress collection loading errors
            const errorStr = String(error);
            if (errorStr.includes('Failed to load collections') || errorStr.includes('EISDIR')) {
              if (logger) logger.debug('Suppressed collection loading error');
              return;
            }
            // Log other errors
            if (logger) logger.error(`Client error: ${errorStr}`);
          }
        }
      ]
    });
    
    // Merge with any additional options
    const mergedOptions = {
      ...requestOptions,
      // Apply any additional options
      ...options,
    };
    
    // Execute the request directly
    return client.request(mergedOptions);
  } catch (error) {
    const errorMessage = `Failed to execute request: ${error instanceof Error ? error.message : String(error)}`;
    if (logger) {
      logger.error(errorMessage);
    }
    throw new Error(errorMessage);
  }
}
