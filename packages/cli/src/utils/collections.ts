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
  requests: Record<string, RequestOptions>;
  [key: string]: unknown;
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
): Promise<string[]> {
  try {
    const collectionPath = await findCollectionFile(collectionDir, collectionName);
    if (!collectionPath) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = await loadCollection(collectionPath);
    return Object.keys(collection.requests || {});
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
    const request = collection.requests?.[requestName];

    if (!request) {
      throw new Error(`Request '${requestName}' not found in collection '${collectionName}'`);
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
    collection.requests[requestName] = request;

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
