import fs from 'fs/promises';
import path from 'path';
import { SHCClient } from './client';
import { ConfigManagerImpl } from '../config-manager';
import {
  Collection,
  CollectionManager as ICollectionManager,
  ExecuteOptions,
  Request,
  VariableSet,
} from '../types/collection.types';
import { Response } from '../types/client.types';
import { RequestConfig } from '../types/config.types';

/**
 * Implementation of the Collection Manager
 * Manages collections, requests, and variable sets
 */
export class CollectionManagerImpl implements ICollectionManager {
  private collections: Map<string, Collection>;
  private globalVariableSets: Map<string, VariableSet>;
  private storagePath: string;
  private client: SHCClient;
  private configManager: ConfigManagerImpl;

  constructor(options?: {
    storagePath?: string;
    client?: SHCClient;
    configManager?: ConfigManagerImpl;
  }) {
    this.collections = new Map<string, Collection>();
    this.globalVariableSets = new Map<string, VariableSet>();
    this.storagePath = options?.storagePath || './collections';
    this.client = options?.client || SHCClient.create({});
    this.configManager = options?.configManager || new ConfigManagerImpl();
  }

  /**
   * Load a collection from a file
   */
  async loadCollection(filePath: string): Promise<Collection> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const collection = JSON.parse(fileContent) as Collection;

      // Validate the collection structure
      this.validateCollection(collection);

      // Store the collection in memory
      this.collections.set(collection.name, collection);

      return collection;
    } catch (error) {
      throw new Error(
        `Failed to load collection from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load all collections from a directory
   * @param directoryPath Path to the directory containing collection files
   * @returns Array of loaded collection names
   */
  async loadCollectionsFromDirectory(directoryPath: string): Promise<string[]> {
    try {
      // Ensure the directory exists
      try {
        await fs.access(directoryPath);
      } catch (error) {
        // Create the directory if it doesn't exist
        await fs.mkdir(directoryPath, { recursive: true });
        return []; // No collections to load yet
      }
      
      // Check if the path is a directory
      const stats = await fs.stat(directoryPath);
      if (!stats.isDirectory()) {
        throw new Error(`Collection path is not a directory: ${directoryPath}`);
      }
      
      // Read all files in the directory
      const files = await fs.readdir(directoryPath);
      
      // Filter for collection files (JSON, YAML, YML files)
      const collectionFiles = files.filter(file => 
        file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
      );
      
      const loadedCollections: string[] = [];
      
      // Load each collection file
      for (const file of collectionFiles) {
        try {
          const filePath = path.join(directoryPath, file);
          
          // Check if the file is a regular file
          const fileStats = await fs.stat(filePath);
          if (!fileStats.isFile()) {
            continue;
          }
          
          // Load the collection
          const collection = await this.loadCollection(filePath);
          loadedCollections.push(collection.name);
        } catch (error) {
          // Continue with other collections even if one fails
          console.error(`Failed to load collection file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return loadedCollections;
    } catch (error) {
      throw new Error(
        `Failed to load collections from directory ${directoryPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save a collection to a file
   */
  async saveCollection(collection: Collection): Promise<void> {
    try {
      // Validate the collection structure
      this.validateCollection(collection);

      // Store the collection in memory
      this.collections.set(collection.name, collection);

      // Ensure the storage directory exists
      await fs.mkdir(this.storagePath, { recursive: true });

      // Save the collection to a file
      const filePath = path.join(this.storagePath, `${collection.name}.json`);
      await fs.writeFile(filePath, JSON.stringify(collection, null, 2), 'utf8');
    } catch (error) {
      throw new Error(
        `Failed to save collection ${collection.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(name: string, config?: Partial<Collection>): Promise<Collection> {
    if (this.collections.has(name)) {
      throw new Error(`Collection with name ${name} already exists`);
    }

    const newCollection: Collection = {
      name,
      version: '1.0.0',
      variableSets: [],
      requests: [],
      ...config,
    };

    // Store the collection in memory
    this.collections.set(name, newCollection);

    // Save the collection to a file
    await this.saveCollection(newCollection);

    return newCollection;
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<void> {
    if (!this.collections.has(name)) {
      throw new Error(`Collection with name ${name} not found`);
    }

    // Remove the collection from memory
    this.collections.delete(name);

    // Delete the collection file
    try {
      const filePath = path.join(this.storagePath, `${name}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // If the file doesn't exist, that's fine, just log it
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw new Error(
          `Failed to delete collection file for ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  /**
   * Add a request to a collection
   */
  async addRequest(collectionName: string, request: Request): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Check if a request with the same ID already exists
    if (collection.requests.some((r) => r.id === request.id)) {
      throw new Error(
        `Request with ID ${request.id} already exists in collection ${collectionName}`
      );
    }

    // Add the request to the collection
    collection.requests.push(request);

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Update a request in a collection
   */
  async updateRequest(collectionName: string, requestId: string, request: Request): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Find the index of the request
    const index = collection.requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error(`Request with ID ${requestId} not found in collection ${collectionName}`);
    }

    // Update the request
    collection.requests[index] = {
      ...request,
      id: requestId, // Ensure the ID remains the same
    };

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Delete a request from a collection
   */
  async deleteRequest(collectionName: string, requestId: string): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Find the index of the request
    const index = collection.requests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      throw new Error(`Request with ID ${requestId} not found in collection ${collectionName}`);
    }

    // Remove the request
    collection.requests.splice(index, 1);

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Add a global variable set
   */
  async addGlobalVariableSet(variableSet: VariableSet): Promise<void> {
    if (this.globalVariableSets.has(variableSet.name)) {
      throw new Error(`Global variable set with name ${variableSet.name} already exists`);
    }

    // Store the variable set
    this.globalVariableSets.set(variableSet.name, variableSet);

    // Save global variable sets to configuration
    await this.saveGlobalVariableSets();
  }

  /**
   * Update a global variable set
   */
  async updateGlobalVariableSet(name: string, variableSet: VariableSet): Promise<void> {
    if (!this.globalVariableSets.has(name)) {
      throw new Error(`Global variable set with name ${name} not found`);
    }

    // Update the variable set
    this.globalVariableSets.set(name, {
      ...variableSet,
      name, // Ensure the name remains the same
    });

    // Save global variable sets to configuration
    await this.saveGlobalVariableSets();
  }

  /**
   * Get a global variable set
   */
  getGlobalVariableSet(name: string): VariableSet {
    const variableSet = this.globalVariableSets.get(name);
    if (!variableSet) {
      throw new Error(`Global variable set with name ${name} not found`);
    }

    return variableSet;
  }

  /**
   * Set the active value for a global variable set
   */
  async setGlobalVariableSetValue(setName: string, valueName: string): Promise<void> {
    const variableSet = this.getGlobalVariableSet(setName);

    // Check if the value exists
    if (!variableSet.values[valueName]) {
      throw new Error(`Value ${valueName} not found in variable set ${setName}`);
    }

    // Update the active value
    variableSet.activeValue = valueName;

    // Save to configuration
    await this.saveGlobalVariableSets();
  }

  /**
   * Add a variable set to a collection
   */
  async addVariableSet(collectionName: string, variableSet: VariableSet): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Check if a variable set with the same name already exists
    if (collection.variableSets.some((vs) => vs.name === variableSet.name)) {
      throw new Error(
        `Variable set with name ${variableSet.name} already exists in collection ${collectionName}`
      );
    }

    // Add the variable set to the collection
    collection.variableSets.push(variableSet);

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Update a variable set in a collection
   */
  async updateVariableSet(
    collectionName: string,
    name: string,
    variableSet: VariableSet
  ): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Find the index of the variable set
    const index = collection.variableSets.findIndex((vs) => vs.name === name);
    if (index === -1) {
      throw new Error(`Variable set with name ${name} not found in collection ${collectionName}`);
    }

    // Update the variable set
    collection.variableSets[index] = {
      ...variableSet,
      name, // Ensure the name remains the same
    };

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Get a variable set from a collection
   */
  async getVariableSet(collectionName: string, name: string): Promise<VariableSet> {
    const collection = await this.getCollection(collectionName);

    // Find the variable set
    const variableSet = collection.variableSets.find((vs) => vs.name === name);
    if (!variableSet) {
      throw new Error(`Variable set with name ${name} not found in collection ${collectionName}`);
    }

    return variableSet;
  }

  /**
   * Set the active value for a variable set in a collection
   */
  async setVariableSetValue(
    collectionName: string,
    setName: string,
    valueName: string
  ): Promise<void> {
    const collection = await this.getCollection(collectionName);

    // Find the variable set
    const variableSet = collection.variableSets.find((vs) => vs.name === setName);
    if (!variableSet) {
      throw new Error(
        `Variable set with name ${setName} not found in collection ${collectionName}`
      );
    }

    // Check if the value exists
    if (!variableSet.values[valueName]) {
      throw new Error(`Value ${valueName} not found in variable set ${setName}`);
    }

    // Update the active value
    variableSet.activeValue = valueName;

    // Save the updated collection
    await this.saveCollection(collection);
  }

  /**
   * Execute a request from a collection
   */
  async executeRequest<T = unknown>(
    collectionName: string,
    requestId: string,
    options?: ExecuteOptions
  ): Promise<Response<T>> {
    const collection = await this.getCollection(collectionName);

    // Find the request
    const request = collection.requests.find((r) => r.id === requestId);
    if (!request) {
      throw new Error(`Request with ID ${requestId} not found in collection ${collectionName}`);
    }

    // Prepare the request configuration
    const requestConfig: RequestConfig = await this.prepareRequestConfig(
      collection,
      request,
      options
    );

    // Execute the request
    return this.client.request<T>(requestConfig);
  }

  /**
   * Get a collection by name
   * @private
   */
  private async getCollection(name: string): Promise<Collection> {
    // Check if the collection is already loaded
    let collection = this.collections.get(name);

    if (!collection) {
      // Try to load the collection from the file system
      try {
        const filePath = path.join(this.storagePath, `${name}.json`);
        collection = await this.loadCollection(filePath);
      } catch {
        throw new Error(`Collection with name ${name} not found`);
      }
    }

    return collection;
  }

  /**
   * Validate a collection structure
   * @private
   */
  private validateCollection(collection: Collection): void {
    if (!collection.name) {
      throw new Error('Collection must have a name');
    }

    if (!collection.version) {
      throw new Error('Collection must have a version');
    }

    if (!Array.isArray(collection.requests)) {
      throw new Error('Collection must have a requests array');
    }

    if (!Array.isArray(collection.variableSets)) {
      throw new Error('Collection must have a variableSets array');
    }
  }

  /**
   * Save global variable sets to configuration
   * @private
   */
  private async saveGlobalVariableSets(): Promise<void> {
    // Convert the Map to an object
    const globalVariableSets = Object.fromEntries(this.globalVariableSets.entries());

    // Save to configuration
    this.configManager.set('variable_sets.global', globalVariableSets);

    await Promise.resolve();
  }

  /**
   * Prepare a request configuration with resolved variables
   * @private
   */
  private async prepareRequestConfig(
    collection: Collection,
    request: Request,
    options?: ExecuteOptions
  ): Promise<RequestConfig> {
    // Start with the base URL from the collection
    const baseURL = collection.baseUrl || '';

    // Combine variables from global and collection variable sets
    const variables = await this.resolveVariables(collection, options?.variableOverrides);

    // Resolve template strings in the request
    const resolvedRequest = await this.resolveRequestTemplates(request, variables);

    // Create the request configuration
    const requestConfig: RequestConfig = {
      url: `${baseURL}${resolvedRequest.path}`,
      method: resolvedRequest.method,
      headers: resolvedRequest.headers,
      query: resolvedRequest.query,
      body: resolvedRequest.body,
      timeout: options?.timeout,
      // Add authentication - prefer request-level auth over collection-level auth
      authentication: resolvedRequest.authentication || collection.authentication,
    };

    return requestConfig;
  }

  /**
   * Resolve variables from global and collection variable sets
   * @private
   */
  private async resolveVariables(
    collection: Collection,
    overrides?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Create a flat variables object for template resolution
    const variables: Record<string, unknown> = {};

    // Process global variable sets
    for (const [name, variableSet] of this.globalVariableSets.entries()) {
      const activeValue = collection.variableSetOverrides?.[name] || variableSet.activeValue;
      const values = variableSet.values[activeValue] || {};

      // Store the variable set values directly under the set name
      variables[name] = values;
    }

    // Process collection variable sets
    if (collection.variableSets) {
      for (const variableSet of collection.variableSets) {
        const activeValue = variableSet.activeValue;
        const values = variableSet.values[activeValue] || {};

        // Store the variable set values directly under the set name
        variables[variableSet.name] = values;
      }
    }

    // Add overrides
    if (overrides) {
      // Handle dot notation in overrides (e.g., 'user.apiKey': 'override-api-key')
      for (const [key, value] of Object.entries(overrides)) {
        if (key.includes('.')) {
          const [setName, ...propertyPath] = key.split('.');

          // If the variable set exists, update the specific property
          if (variables[setName] && typeof variables[setName] === 'object') {
            let target = variables[setName] as Record<string, unknown>;

            // Navigate to the nested property, creating objects as needed
            for (let i = 0; i < propertyPath.length - 1; i++) {
              const part = propertyPath[i];
              if (!target[part] || typeof target[part] !== 'object') {
                target[part] = {};
              }
              target = target[part] as Record<string, unknown>;
            }

            // Set the value at the final property
            if (propertyPath.length > 0) {
              target[propertyPath[propertyPath.length - 1]] = value;
            }
          }
        } else {
          // Direct assignment for simple keys
          variables[key] = value;
        }
      }
    }

    await Promise.resolve();
    return variables;
  }

  /**
   * Resolve template strings in a request
   * @private
   */
  private async resolveRequestTemplates(
    request: Request,
    variables: Record<string, unknown>
  ): Promise<Request> {
    // Create a deep copy of the request to avoid modifying the original
    const resolvedRequest = JSON.parse(JSON.stringify(request)) as Request;

    // Helper function to resolve template strings
    const resolveTemplate = (template: string): string => {
      return template.replace(/\${variables\.([^}]+)}/g, (_, path: string) => {
        const parts: string[] = path.split('.');

        if (parts.length >= 2) {
          const [setName, ...propertyPath] = parts;
          const variableSet = variables[setName];

          if (variableSet && typeof variableSet === 'object') {
            // Navigate through the property path
            let value: unknown = variableSet;
            for (const part of propertyPath) {
              if (
                value &&
                typeof value === 'object' &&
                part in (value as Record<string, unknown>)
              ) {
                value = (value as Record<string, unknown>)[part];
              } else {
                return '';
              }
            }

            return String(value ?? '');
          }
        }

        return '';
      });
    };

    // Resolve templates in path
    if (resolvedRequest.path) {
      resolvedRequest.path = resolveTemplate(resolvedRequest.path);
    }

    // Resolve templates in headers
    if (resolvedRequest.headers) {
      for (const [key, value] of Object.entries(resolvedRequest.headers)) {
        if (typeof value === 'string') {
          resolvedRequest.headers[key] = resolveTemplate(value);
        }
      }
    }

    // Resolve templates in query parameters
    if (resolvedRequest.query) {
      for (const [key, value] of Object.entries(resolvedRequest.query)) {
        if (typeof value === 'string') {
          resolvedRequest.query[key] = resolveTemplate(value);
        }
      }
    }

    // Resolve templates in body
    if (resolvedRequest.body && typeof resolvedRequest.body === 'string') {
      resolvedRequest.body = resolveTemplate(resolvedRequest.body);
    } else if (resolvedRequest.body && typeof resolvedRequest.body === 'object') {
      resolvedRequest.body = this.resolveObjectTemplates(resolvedRequest.body, resolveTemplate);
    }

    await Promise.resolve();
    return resolvedRequest;
  }

  /**
   * Resolve template strings in an object
   * @private
   */
  private resolveObjectTemplates(
    obj: unknown,
    resolveTemplate: (template: string) => string
  ): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolveObjectTemplates(item, resolveTemplate));
    }

    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.resolveObjectTemplates(value, resolveTemplate);
      }
      return result;
    }

    if (typeof obj === 'string') {
      return resolveTemplate(obj);
    }

    return obj;
  }
}

/**
 * Create a new CollectionManager instance
 */
export const createCollectionManager = (options?: {
  storagePath?: string;
  client?: SHCClient;
  configManager?: ConfigManagerImpl;
}): ICollectionManager => {
  return new CollectionManagerImpl(options);
};
