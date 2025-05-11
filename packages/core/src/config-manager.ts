import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import merge from 'lodash.merge';
import type { ConfigManager as IConfigManager, TemplateFunction, TemplateContext, ValidationResult } from './types/config.types';
import { SHCConfig } from './types/client.types';
import { createTemplateEngine, TemplateEngine } from './services/template-engine';
import { EventEmitter } from 'events';
import { 
  configSchema, 
  formatValidationErrors, 
  safeValidateConfig, 
  validateConfig as validateConfigSchema, 
  validatePartialConfig, 
  SHCConfigSchema,
  fileReferenceSchema 
} from './schemas/config.schema';
import { z } from 'zod';

// Add type declarations for Node.js global objects
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

export class ConfigManagerImpl implements IConfigManager {
  private config: SHCConfig;
  private env: Record<string, string>;
  private templateEngine: TemplateEngine;
  private eventEmitter: EventEmitter;
  private secretStore: Map<string, string> = new Map();
  private configFilePath?: string;

  constructor(initialConfig?: Partial<SHCConfig>) {
    this.config = {
      version: '1.0.0',
      name: initialConfig?.name || 'Default SHC Configuration',
      core: {
        http: {
          timeout: initialConfig?.core?.http?.timeout || 30000,
          max_redirects: initialConfig?.core?.http?.max_redirects || 5,
          retry: {
            attempts: initialConfig?.core?.http?.retry?.attempts || 3,
            backoff: initialConfig?.core?.http?.retry?.backoff || 'exponential'
          },
          tls: {
            verify: initialConfig?.core?.http?.tls?.verify ?? true
          }
        },
        logging: {
          level: initialConfig?.core?.logging?.level || 'info',
          format: initialConfig?.core?.logging?.format || 'text',
          output: initialConfig?.core?.logging?.output || 'console'
        }
      },
      variable_sets: {
        global: initialConfig?.variable_sets?.global || {},
        collection_defaults: initialConfig?.variable_sets?.collection_defaults || {},
        request_overrides: initialConfig?.variable_sets?.request_overrides || {}
      },
      plugins: {
        auth: initialConfig?.plugins?.auth || [],
        preprocessors: initialConfig?.plugins?.preprocessors || [],
        transformers: initialConfig?.plugins?.transformers || []
      },
      storage: {
        collections: {
          type: initialConfig?.storage?.collections?.type || 'file',
          path: initialConfig?.storage?.collections?.path || './collections'
        }
      }
    };

    this.env = Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
    );

    this.templateEngine = createTemplateEngine();
    this.eventEmitter = new EventEmitter();
    
    // Initialize collections property
    if (!this.config.collections) {
      this.config.collections = { items: [], files: [], directories: [] };
    }
  }

  async loadFromFile(filePath: string): Promise<void> {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      const fileContent = await fs.readFile(filePath, 'utf8');

      let parsedConfig: Partial<SHCConfig>;
      if (fileExt === '.yaml' || fileExt === '.yml') {
        parsedConfig = yaml.load(fileContent) as Partial<SHCConfig>;
      } else if (fileExt === '.json') {
        parsedConfig = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }

      // Validate the configuration using Zod schema
      const validationResult = await this.validateSchema(parsedConfig);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors?.join(', ')}`);
      }

      // Store the config file path for resolving relative paths
      this.configFilePath = path.resolve(filePath);

      // Process relative paths in the config
      if (parsedConfig.storage?.collections?.path && !path.isAbsolute(parsedConfig.storage.collections.path)) {
        const configDir = path.dirname(this.configFilePath);
        parsedConfig.storage.collections.path = path.resolve(configDir, parsedConfig.storage.collections.path);
      }

      // Process variable sets with file references
      if (parsedConfig.variable_sets) {
        await this.processExternalVariableSets(parsedConfig.variable_sets);
      }

      this.config = this.mergeConfigs(this.config, parsedConfig);
      
      // Load collections from the configured path if autoload is enabled
      if (this.config.storage?.collections?.autoload !== false) {
        await this.loadCollectionsFromPath();
      }
      
      this.eventEmitter.emit('config:loaded', this.config);
    } catch (error) {
      throw new Error(`Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  async loadFromString(content: string): Promise<void> {
    try {
      const parsedConfig = yaml.load(content) as Partial<SHCConfig>;
      
      // Validate the configuration using Zod schema
      const validationResult = await this.validateSchema(parsedConfig);
      if (!validationResult.valid) {
        throw new Error(`Invalid configuration: ${validationResult.errors?.join(', ')}`);
      }
      
      this.config = this.mergeConfigs(this.config, parsedConfig);
      
      // Load collections from the configured path if autoload is enabled
      if (this.config.storage?.collections?.autoload !== false) {
        await this.loadCollectionsFromPath();
      }
      
      this.eventEmitter.emit('config:loaded', this.config);
    } catch (error) {
      throw new Error(`Failed to parse configuration string: ${error instanceof Error ? error.message : error}`);
    }
  }

  get<T>(path: string, defaultValue?: T): T {
    // If path is empty, return the entire config
    if (!path) {
      return this.config as unknown as T;
    }
    
    const keys = path.split('.');
    let current: unknown = this.config;

    for (const key of keys) {
      if (
        current &&
        typeof current === 'object' &&
        current !== null &&
        // Check if the key exists and the object has the property (for typed objects)
        (key in current || Object.prototype.hasOwnProperty.call(current, key))
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return defaultValue as T;
      }
    }

    return current as T;
  }

  set(path: string, value: unknown): void {
    const keys = path.split('.');
    let current: unknown = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current && typeof current === 'object' && !(key in current)) {
        (current as Record<string, unknown>)[key] = {};
      }
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      }
    }

    if (current && typeof current === 'object') {
      (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
    }
    this.eventEmitter.emit('config:updated', { path, value });
  }

  // Resolve a path that might be relative to the config file
  resolveConfigPath(relativePath: string): string {
    if (path.isAbsolute(relativePath)) {
      return relativePath;
    }
    
    if (this.configFilePath) {
      const configDir = path.dirname(this.configFilePath);
      return path.resolve(configDir, relativePath);
    }
    
    // If no config file path is set, resolve relative to current working directory
    return path.resolve(relativePath);
  }

  // Flag to track if collections have been loaded
  private collectionsLoaded = false;

  // Get the collection directory path, resolving relative paths if needed
  getCollectionPath(): string {
    const collectionPath = this.get<string>('storage.collections.path', './collections');
    return this.resolveConfigPath(collectionPath);
  }
  
  /**
   * Load collections from the configured path
   * This is a public method that can be called to refresh collections
   * If collections have already been loaded, this will not reload them unless force=true
   * @param force Force reloading collections even if they've already been loaded
   */
  async loadCollections(force = false): Promise<void> {
    // Skip loading if already loaded and not forced
    if (this.collectionsLoaded && !force) {
      return;
    }
    
    try {
      const collectionsPath = this.getCollectionPath();
      
      // Check if the path exists
      try {
        await fs.access(collectionsPath);
      } catch (error) {
        // Create the directory if it doesn't exist
        await fs.mkdir(collectionsPath, { recursive: true });
        this.collectionsLoaded = true; // Mark as loaded even though there are no collections yet
        return; // No collections to load yet
      }
      
      // Check if the path is a directory
      try {
        const stats = await fs.stat(collectionsPath);
        if (!stats.isDirectory()) {
          throw new Error(`Collections path is not a directory: ${collectionsPath}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Collections path is not a directory')) {
          throw error; // Rethrow our own error
        }
        throw new Error(`Failed to stat collections path: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Load collections from the directory
      await this.loadCollectionsFromDirectory(collectionsPath);
      this.collectionsLoaded = true;
      this.eventEmitter.emit('collections:loaded', this.config.collections);
    } catch (error) {
      // Handle errors during collection loading
      this.eventEmitter.emit('error', 
        new Error(`Failed to load collections from config: ${error instanceof Error ? error.message : String(error)}`)
      );
      throw error; // Rethrow the error so callers can handle it
    }
  }
  
  /**
   * Safely load collections from a directory path
   * This method ensures we only read files, not directories
   * @param directoryPath Path to the directory containing collection files
   */
  async loadCollectionsFromDirectory(directoryPath: string): Promise<void> {
    try {
      // Ensure the directory exists
      try {
        await fs.access(directoryPath);
      } catch (error) {
        // Create the directory if it doesn't exist
        await fs.mkdir(directoryPath, { recursive: true });
        return; // No collections to load yet
      }
      
      // Check if the path is a directory
      let stats;
      try {
        stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
          this.eventEmitter.emit('error', new Error(`Collections path is not a directory: ${directoryPath}`));
          return;
        }
      } catch (error) {
        this.eventEmitter.emit('error', new Error(`Failed to stat collections path: ${error instanceof Error ? error.message : String(error)}`));
        return;
      }
      
      // Read all files in the collections directory
      let files;
      try {
        files = await fs.readdir(directoryPath);
      } catch (error) {
        this.eventEmitter.emit('error', new Error(`Failed to read collections directory: ${error instanceof Error ? error.message : String(error)}`));
        return;
      }
      
      const collectionFiles = files.filter(file => 
        file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml')
      );
      
      // Initialize collections array if it doesn't exist
      if (!this.config.collections) {
        this.config.collections = { items: [] };
      }
      if (!this.config.collections.items) {
        this.config.collections.items = [];
      }
      
      // Track loaded collections for this path
      const loadedCollections: string[] = [];
      
      // Load each collection file using the loadCollectionFromFile method
      for (const file of collectionFiles) {
        try {
          const filePath = path.join(directoryPath, file);
          
          // Check if the path is a file before attempting to load
          try {
            const fileStats = await fs.stat(filePath);
            if (!fileStats.isFile()) {
              // Skip directories and other non-file entries
              continue;
            }
            
            // Load the collection file
            await this.loadCollectionFromFile(filePath);
            
            // Find the collection that was just loaded
            const loadedCollection = this.config.collections.items.find(
              c => c.metadata?.filePath === filePath || c.metadata?.fileName === file
            );
            
            if (loadedCollection) {
              loadedCollections.push(loadedCollection.name);
            }
          } catch (error) {
            // Log warning but continue with other files
            this.eventEmitter.emit('warning', new Error(
              `Failed to load collection file ${file}: ${error instanceof Error ? error.message : String(error)}`
            ));
          }
        } catch (error) {
          // Log warning but continue with other files
          this.eventEmitter.emit('warning', new Error(
            `Failed to process collection file ${file}: ${error instanceof Error ? error.message : String(error)}`
          ));
        }
      }
      
      // Store the collection directory in the config
      if (!this.config.collections.directories) {
        this.config.collections.directories = [];
      }
      if (!this.config.collections.directories.includes(directoryPath)) {
        this.config.collections.directories.push(directoryPath);
      }
      
      // Emit event with loaded collections
      if (loadedCollections.length > 0) {
        this.eventEmitter.emit('collections:loaded:path', {
          path: directoryPath,
          collections: loadedCollections
        });
      }
    } catch (error) {
      this.eventEmitter.emit('error', new Error(
        `Failed to load collections from directory ${directoryPath}: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }
  
  /**
   * Load collections from the configured path
   * This will scan the collections directory and load all collections into the config
   * @private
   */
  private async loadCollectionsFromPath(): Promise<void> {
    try {
      const collectionsPath = this.getCollectionPath();
      // Use our new method to safely load collections from the directory
      await this.loadCollectionsFromDirectory(collectionsPath);
    } catch (error) {
      // Rethrow the error to be handled by the caller
      throw new Error(`Failed to load collection from path ${this.getCollectionPath()}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Load a collection from a specific file path
   * This loads a single collection file and adds it to the config
   * @param filePath The path to the collection file
   * @returns A promise that resolves when the collection is loaded
   */
  async loadCollectionFromFile(filePath: string): Promise<void> {
    try {
      // Check if the file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        throw new Error(`Collection file not found: ${filePath}`);
      }
      
      // Check if the file is a regular file
      const fileStats = await fs.stat(filePath);
      if (!fileStats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }
      
      // Read file content
      let content;
      try {
        content = await fs.readFile(filePath, 'utf8');
      } catch (readError) {
        throw new Error(`Failed to read file ${filePath}: ${readError instanceof Error ? readError.message : String(readError)}`);
      }
      
      // Parse file content
      let collection;
      try {
        if (filePath.endsWith('.json')) {
          collection = JSON.parse(content);
        } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
          collection = yaml.load(content);
        } else {
          throw new Error(`Unsupported file type: ${filePath}`);
        }
      } catch (parseError) {
        throw new Error(`Failed to parse file ${filePath}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Add the collection to the config if it's valid
      if (collection && typeof collection === 'object' && 'name' in collection) {
        // Initialize collections array if it doesn't exist
        if (!this.config.collections) {
          this.config.collections = { items: [] };
        }
        if (!this.config.collections.items) {
          this.config.collections.items = [];
        }
        
        // Add file path to the collection metadata
        collection.metadata = collection.metadata || {};
        collection.metadata.filePath = filePath;
        collection.metadata.fileName = path.basename(filePath);
        
        // Normalize collection structure
        this.normalizeCollection(collection);
        
        // Check if the collection already exists
        const existingIndex = this.config.collections.items.findIndex(
          c => c.name === collection.name
        );
        
        if (existingIndex >= 0) {
          // Update existing collection
          this.config.collections.items[existingIndex] = collection;
        } else {
          // Add new collection
          this.config.collections.items.push(collection);
        }
        
        // Store the collection file path in the config
        if (!this.config.collections.files) {
          this.config.collections.files = [];
        }
        if (!this.config.collections.files.includes(filePath)) {
          this.config.collections.files.push(filePath);
        }
        
        // Also track the directory for reference
        const collectionDir = path.dirname(filePath);
        if (!this.config.collections.directories) {
          this.config.collections.directories = [];
        }
        if (!this.config.collections.directories.includes(collectionDir)) {
          this.config.collections.directories.push(collectionDir);
        }
        
        // Emit event for the loaded collection
        this.eventEmitter.emit('collection:loaded', {
          path: filePath,
          collection: collection.name
        });
      } else {
        throw new Error(`Invalid collection in file ${filePath}: missing name property`);
      }
    } catch (error) {
      this.eventEmitter.emit('error', new Error(
        `Failed to load collection from file ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }
  
  /**
   * Normalize collection structure to handle different naming conventions
   * @private
   */
  private normalizeCollection(collection: any): void {
    // Ensure metadata exists
    collection.metadata = collection.metadata || {};
    // Handle both baseUrl and base_url naming conventions
    if (!collection.baseUrl && collection.base_url) {
      collection.baseUrl = collection.base_url;
    }
    
    // Ensure requests array exists
    if (!collection.requests) {
      collection.requests = [];
    }
    
    // Ensure each request has an id
    for (const request of collection.requests) {
      if (!request.id && request.name) {
        request.id = request.name.toLowerCase().replace(/\s+/g, '-');
      }
    }
  }

  has(path: string): boolean {
    const keys = path.split('.');
    let current: unknown = this.config;

    for (const key of keys) {
      if (
        current &&
        typeof current === 'object' &&
        current !== null &&
        (key in current || Object.prototype.hasOwnProperty.call(current, key))
      ) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return false;
      }
    }

    return true;
  }

  getEnv(name: string, defaultValue?: string): string {
    return this.env[name] || defaultValue || '';
  }

  requireEnv(name: string): string {
    const value = this.env[name];
    if (!value) {
      throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
  }

  async resolve(template: string, context?: Partial<TemplateContext>): Promise<string> {
    // Create a context with config and env
    const resolveContext: Partial<TemplateContext> = {
      env: this.env,
      config: this.config,
      ...context
    };
    
    // Add custom template function to handle variable set resolution with proper precedence
    this.templateEngine.registerFunction('var', {
      name: 'get',
      description: 'Get a variable value from variable sets with proper precedence',
      parameters: [
        {
          name: 'namespace',
          type: 'string',
          description: 'The variable set namespace',
          required: true
        },
        {
          name: 'key',
          type: 'string',
          description: 'The variable key (optional)',
          required: false
        }
      ],
      execute: async (namespace: unknown, key?: unknown) => {
        if (typeof namespace !== 'string') {
          throw new Error('Namespace must be a string');
        }
        
        if (key !== undefined && typeof key !== 'string') {
          throw new Error('Key must be a string');
        }
        
        return this.getVariableValue(namespace, key as string | undefined);
      }
    });
    
    return this.templateEngine.resolve(template, resolveContext);
  }

  async resolveObject<T>(obj: T, context?: Partial<TemplateContext>): Promise<T> {
    // Create a context with config and env
    const resolveContext: Partial<TemplateContext> = {
      env: this.env,
      config: this.config,
      ...context
    };
    
    return this.templateEngine.resolveObject(obj, resolveContext);
  }

  async validateConfig(config: Record<string, unknown>): Promise<boolean> {
    // Use schema validation instead of manual validation
    try {
      // Use the validateSchema method which uses Zod schema validation
      const validationResult = await this.validateSchema(config);
      
      if (!validationResult.valid) {
        // If validation fails, throw an error with the validation errors
        throw new Error(`Invalid configuration: ${validationResult.errors?.join(', ')}`);
      }
      
      return true;
    } catch (error) {
      // Re-throw the error
      throw error;
    }
  }

  async validateSchema(config: unknown): Promise<ValidationResult> {
    try {
      const result = await configSchema.safeParseAsync(config);
      
      if (!result.success) {
        // Handle the case where result.error might be undefined
        const errors = result.error ? formatValidationErrors(result.error) : ['Unknown validation error'];
        return { valid: false, errors: Array.isArray(errors) ? errors : [errors] };
      }
      
      return { valid: true, errors: [] };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : String(error);
      return { 
        valid: false, 
        errors: [errorMessage] 
      };
    }
  }

  async validateCurrentConfig(): Promise<ValidationResult> {
    return this.validateSchema(this.config);
  }



  async getSecret(key: string): Promise<string> {
    const secret = this.secretStore.get(key);
    if (!secret) {
      throw new Error(`Secret not found: ${key}`);
    }
    return secret;
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secretStore.set(key, value);
  }

  registerTemplateFunction(namespace: string, func: TemplateFunction): void {
    this.templateEngine.registerFunction(namespace, func);
  }

  getTemplateFunction(path: string): TemplateFunction | undefined {
    return this.templateEngine.getFunction(path);
  }

  /**
   * Get a variable value from variable sets with proper precedence
   * Precedence order:
   * 1. Request-specific overrides (highest)
   * 2. Collection-level overrides
   * 3. Global variable sets (lowest)
   * 
   * @param namespace The variable set namespace
   * @param key The variable key
   * @returns The variable value or undefined if not found
   */
  getVariableValue(namespace: string, key?: string): unknown {
    // Check request-specific overrides first (highest precedence)
    const requestOverrides = this.get<Record<string, unknown>>('variable_sets.request_overrides', {});
    if (namespace in requestOverrides) {
      const varSet = requestOverrides[namespace] as Record<string, unknown>;
      
      // If key is not provided, return the active value for the variable set
      if (!key && 'active_value' in varSet) {
        return varSet.active_value;
      }
      
      // If key is provided, return the specific value
      if (key && 'values' in varSet && typeof varSet.values === 'object' && varSet.values) {
        const values = varSet.values as Record<string, unknown>;
        if (key in values) {
          return values[key];
        }
      }
    }
    
    // Check collection-level overrides next
    const collectionDefaults = this.get<Record<string, unknown>>('variable_sets.collection_defaults', {});
    if (namespace in collectionDefaults) {
      const varSet = collectionDefaults[namespace] as Record<string, unknown>;
      
      // If key is not provided, return the active value for the variable set
      if (!key && 'active_value' in varSet) {
        return varSet.active_value;
      }
      
      // If key is provided, return the specific value
      if (key && 'values' in varSet && typeof varSet.values === 'object' && varSet.values) {
        const values = varSet.values as Record<string, unknown>;
        if (key in values) {
          return values[key];
        }
      }
    }
    
    // Check global variable sets last (lowest precedence)
    const globalVarSets = this.get<Record<string, unknown>>('variable_sets.global', {});
    if (namespace in globalVarSets) {
      const varSet = globalVarSets[namespace] as Record<string, unknown>;
      
      // If key is not provided, return the active value for the variable set
      if (!key && 'active_value' in varSet) {
        return varSet.active_value;
      }
      
      // If key is provided, return the specific value
      if (key && 'values' in varSet && typeof varSet.values === 'object' && varSet.values) {
        const values = varSet.values as Record<string, unknown>;
        if (key in values) {
          return values[key];
        }
      }
    }
    
    // Variable not found in any variable set
    return undefined;
  }

  private mergeConfigs(base: SHCConfig, update?: Partial<SHCConfig>): SHCConfig {
    if (!update) {
      return base;
    }

    // Create a deep copy of the base config to avoid mutating it
    // Use lodash.merge for deep cloning instead of JSON.parse/stringify to handle functions
    const baseClone = merge({}, base);
    
    // Handle special cases for arrays that should be replaced instead of merged
    const pluginsToReplace: Record<string, boolean> = {};
    
    if (update.plugins) {
      // Mark plugin arrays that should be replaced rather than merged
      if (update.plugins.auth) pluginsToReplace['plugins.auth'] = true;
      if (update.plugins.preprocessors) pluginsToReplace['plugins.preprocessors'] = true;
      if (update.plugins.transformers) pluginsToReplace['plugins.transformers'] = true;
    }
    
    // Use lodash.merge for deep merging
    const merged = merge({}, baseClone, update);
    
    // Handle special case for plugin arrays - we want to replace them, not merge them
    if (update.plugins && merged.plugins) {
      if (pluginsToReplace['plugins.auth'] && update.plugins.auth) {
        merged.plugins.auth = [...update.plugins.auth];
      }
      
      if (pluginsToReplace['plugins.preprocessors'] && update.plugins.preprocessors) {
        merged.plugins.preprocessors = [...update.plugins.preprocessors];
      }
      
      if (pluginsToReplace['plugins.transformers'] && update.plugins.transformers) {
        merged.plugins.transformers = [...update.plugins.transformers];
      }
    }
    
    return merged;
  }
  
  /**
   * Process variable sets with file references
   * @param variableSets The variable sets object from the config
   */
  private async processExternalVariableSets(variableSets: Record<string, unknown>): Promise<void> {
    // Process global variable set
    if (variableSets.global && typeof variableSets.global === 'object') {
      try {
        const processed = await this.processVariableSetReference(variableSets.global);
        variableSets.global = processed;
      } catch (error) {
        console.error(`Error processing global variable set: ${error instanceof Error ? error.message : error}`);
        throw error;
      }
    }
    
    // Process collection_defaults variable set
    if (variableSets.collection_defaults && typeof variableSets.collection_defaults === 'object') {
      try {
        const processed = await this.processVariableSetReference(variableSets.collection_defaults);
        variableSets.collection_defaults = processed;
      } catch (error) {
        console.error(`Error processing collection_defaults variable set: ${error instanceof Error ? error.message : error}`);
        throw error;
      }
    }
    
    // Process named variable sets (any key other than global and collection_defaults)
    for (const [key, value] of Object.entries(variableSets)) {
      if (key !== 'global' && key !== 'collection_defaults' && value && typeof value === 'object') {
        try {
          const processed = await this.processVariableSetReference(value);
          variableSets[key] = processed;
        } catch (error) {
          console.error(`Error processing variable set '${key}': ${error instanceof Error ? error.message : error}`);
          throw error;
        }
      }
    }
  }

  /**
   * Process a variable set reference, which can be either an inline object or a file reference
   * @param variableSet The variable set object or file reference
   * @returns The processed variable set
   */
  private async processVariableSetReference(variableSet: unknown): Promise<unknown> {
    // Check if it's a file reference
    try {
      if (variableSet && typeof variableSet === 'object') {
        // Check if it has a 'file' or 'glob' property
        const obj = variableSet as Record<string, unknown>;
        
        if ('glob' in obj && typeof obj.glob === 'string') {
          return await this.loadVariableSetFromGlob(obj.glob);
        } else if ('file' in obj && typeof obj.file === 'string') {
          return await this.loadVariableSetFromFile(obj.file);
        }
      }
      
      // Use Zod schema for validation
      const result = fileReferenceSchema.safeParse(variableSet);
      if (result.success) {
        const fileRef = result.data;
        
        if (fileRef.glob) {
          return await this.loadVariableSetFromGlob(fileRef.glob);
        } else if (fileRef.file) {
          return await this.loadVariableSetFromFile(fileRef.file);
        }
      }
    } catch (error) {
      // If it's not a valid file reference, assume it's an inline variable set
      console.error(`Error processing variable set reference: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
    
    // Return the original variable set if it's not a file reference
    return variableSet;
  }

  /**
   * Load a variable set from a file
   * @param filePath The path to the file
   * @returns The loaded variable set
   */
  private async loadVariableSetFromFile(filePath: string): Promise<Record<string, unknown>> {
    try {
      const resolvedPath = this.resolveConfigPath(filePath);
      const fileExt = path.extname(resolvedPath).toLowerCase();
      
      // Check if file exists
      try {
        await fs.access(resolvedPath);
      } catch (error) {
        throw new Error(`File not found: ${resolvedPath}`);
      }
      
      const fileContent = await fs.readFile(resolvedPath, 'utf8');
      
      let result: Record<string, unknown>;
      if (fileExt === '.yaml' || fileExt === '.yml') {
        result = yaml.load(fileContent) as Record<string, unknown>;
      } else if (fileExt === '.json') {
        result = JSON.parse(fileContent);
      } else {
        throw new Error(`Unsupported file type: ${fileExt}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to load variable set from ${filePath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load variable sets from files matching a glob pattern
   * @param globPattern The glob pattern to match files
   * @returns The merged variable sets from all matching files
   */
  private async loadVariableSetFromGlob(globPattern: string): Promise<Record<string, unknown>> {
    try {
      // For simplicity, we'll just handle basic patterns like "*.yaml" or "*.json"
      const resolvedDir = path.dirname(this.resolveConfigPath(globPattern));
      const pattern = path.basename(globPattern);
      
      // Get all files in the directory
      const files = await fs.readdir(resolvedDir);
      
      // Filter files based on the pattern
      const matchingFiles = files.filter(file => {
        // Simple pattern matching for *.ext
        if (pattern.startsWith('*')) {
          const ext = pattern.substring(1); // Get the extension part
          return file.endsWith(ext);
        }
        return file === pattern;
      }).map(file => path.join(resolvedDir, file));
      
      if (matchingFiles.length === 0) {
        throw new Error(`No files found matching glob pattern: ${globPattern}`);
      }
      
      const result: Record<string, unknown> = {};
      
      // Process each file and merge the results
      for (const file of matchingFiles) {
        try {
          const fileContent = await fs.readFile(file, 'utf8');
          const fileExt = path.extname(file).toLowerCase();
          
          let fileVariables: Record<string, unknown>;
          if (fileExt === '.yaml' || fileExt === '.yml') {
            fileVariables = yaml.load(fileContent) as Record<string, unknown>;
          } else if (fileExt === '.json') {
            fileVariables = JSON.parse(fileContent);
          } else {
            console.warn(`Skipping unsupported file type: ${fileExt}`);
            continue;
          }
          
          // Deep merge the variables
          merge(result, fileVariables);
        } catch (error) {
          console.warn(`Error loading variable set from ${file}: ${error instanceof Error ? error.message : error}`);
          // Continue with other files even if one fails
        }
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to load variable sets from glob ${globPattern}: ${error instanceof Error ? error.message : error}`);
    }
  }
  
  // Helper method to create default core config
  private createDefaultCore(): SHCConfig['core'] {
    return {
      http: {
        timeout: 30000,
        max_redirects: 5,
        retry: {
          attempts: 3,
          backoff: 'exponential'
        },
        tls: {
          verify: true
        }
      },
      logging: {
        level: 'info',
        format: 'text',
        output: 'console'
      }
    };
  }
}

export function createConfigManager(initialConfig?: Partial<SHCConfig>): IConfigManager {
  return new ConfigManagerImpl(initialConfig);
}