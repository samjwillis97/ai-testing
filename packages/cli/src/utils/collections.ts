/**
 * Collection management utilities
 */
import * as fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { RequestOptions } from '../types.js';

/**
 * Collection interface
 */
interface Collection {
  requests: Record<string, RequestOptions> | RequestOptions[];
  [key: string]: unknown;
}

/**
 * Request interface with ID and name
 */
export interface RequestInfo {
  id: string;
  name: string;
  description?: string;
  method?: string;
}

/**
 * Get available collections
 */
export async function getCollections(collectionDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(collectionDir);
    return files
      .filter((file) => file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'))
      .map((file) => path.basename(file, path.extname(file)));
  } catch (error) {
    throw new Error(
      `Failed to read collections directory: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get available requests in a collection
 */
export async function getRequests(
  collectionDir: string,
  collectionName: string
): Promise<RequestInfo[]> {
  try {
    const collectionPath = await findCollectionFile(collectionDir, collectionName);
    if (!collectionPath) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = await loadCollection(collectionPath);
    
    // Handle both array-based and object-based request collections
    if (Array.isArray(collection.requests)) {
      // Array-based collection (like in httpbin.yaml)
      return collection.requests.map(req => ({
        id: req.id as string || '',
        name: req.name as string || req.id as string || 'Unnamed Request',
        description: req.description as string,
        method: req.method as string
      }));
    } else if (typeof collection.requests === 'object' && collection.requests !== null) {
      // Object-based collection (key-value pairs)
      return Object.entries(collection.requests).map(([id, req]) => ({
        id,
        name: (req.name as string) || id,
        description: req.description as string,
        method: req.method as string
      }));
    }
    
    return [];
  } catch (error) {
    throw new Error(
      `Failed to read requests: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Find collection file by name
 */
export async function findCollectionFile(
  collectionDir: string,
  collectionName: string
): Promise<string | null> {
  try {
    const files = await fs.readdir(collectionDir);
    const possibleExtensions = ['.json', '.yaml', '.yml'];

    for (const ext of possibleExtensions) {
      const fileName = `${collectionName}${ext}`;
      if (files.includes(fileName)) {
        return path.join(collectionDir, fileName);
      }
    }

    return null;
  } catch (error) {
    throw new Error(
      `Failed to find collection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Load collection from file
 */
export async function loadCollection(filePath: string): Promise<Collection> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    if (filePath.endsWith('.json')) {
      return JSON.parse(content) as Collection;
    } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return yaml.load(content) as Collection;
    } else {
      throw new Error(`Unsupported file format: ${path.extname(filePath)}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to load collection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get request from collection
 */
export async function getRequest(
  collectionDir: string,
  collectionName: string,
  requestName: string
): Promise<RequestOptions> {
  try {
    const collectionPath = await findCollectionFile(collectionDir, collectionName);
    if (!collectionPath) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = await loadCollection(collectionPath);
    
    // Handle both array-based and object-based request collections
    let request: RequestOptions | undefined;
    
    if (Array.isArray(collection.requests)) {
      // Array-based collection (like in httpbin.yaml)
      request = collection.requests.find(req => 
        (req.id === requestName) || (req.name === requestName)
      );
    } else if (typeof collection.requests === 'object' && collection.requests !== null) {
      // Object-based collection (key-value pairs)
      request = collection.requests[requestName];
    }

    if (!request) {
      throw new Error(`Request '${requestName}' not found in collection '${collectionName}'`);
    }

    // Add baseUrl from collection if it exists (handle both camelCase and snake_case)
    if ('base_url' in collection && typeof collection.base_url === 'string' && !request.baseUrl) {
      request.baseUrl = collection.base_url;
    } else if ('baseUrl' in collection && typeof collection.baseUrl === 'string' && !request.baseUrl) {
      request.baseUrl = collection.baseUrl;
    }

    return request;
  } catch (error) {
    throw new Error(
      `Failed to get request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Save request to collection
 */
export async function saveRequest(
  collectionDir: string,
  collectionName: string,
  requestName: string,
  request: RequestOptions
): Promise<void> {
  try {
    let collectionPath = await findCollectionFile(collectionDir, collectionName);
    let collection: Collection = { requests: {} };

    // Create new collection if it doesn't exist
    if (!collectionPath) {
      collectionPath = path.join(collectionDir, `${collectionName}.json`);
    } else {
      collection = await loadCollection(collectionPath);
      if (!collection.requests) {
        collection.requests = {};
      }
    }

    // Add or update request
    if (Array.isArray(collection.requests)) {
      // For array-based collections, find and update the existing request or add a new one
      const index = collection.requests.findIndex(req => 
        (req.id === requestName) || (req.name === requestName)
      );
      
      if (index >= 0) {
        // Update existing request
        collection.requests[index] = {
          ...collection.requests[index],
          ...request,
          id: requestName // Ensure ID is set
        };
      } else {
        // Add new request
        collection.requests.push({
          ...request,
          id: requestName
        });
      }
    } else {
      // For object-based collections, simply set the request
      (collection.requests as Record<string, RequestOptions>)[requestName] = request;
    }

    // Save collection
    const content = collectionPath.endsWith('.json')
      ? JSON.stringify(collection, null, 2)
      : yaml.dump(collection);

    await fs.writeFile(collectionPath, content, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to save request: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
