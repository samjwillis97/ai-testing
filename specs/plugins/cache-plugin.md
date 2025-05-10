# Response Cache Plugin

## Overview

The Response Cache Plugin showcases response handling and storage capabilities within the SHC plugin system. This plugin improves performance and reduces API load by caching responses and serving them for subsequent identical requests.

## Features

- In-memory and disk-based caching
- Configurable cache strategies
- Cache invalidation rules
- Cache hit/miss statistics
- Support for cache headers (ETag, Cache-Control)

## Configuration

```typescript
interface CacheConfig {
  storage: {
    type: 'memory' | 'disk' | 'redis';
    options: {
      maxSize?: number;
      path?: string;
      ttl?: number;
    };
  };
  rules: {
    pattern: string;
    strategy: 'cache-first' | 'network-first';
    ttl: number;
  }[];
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storage.type` | string | `'memory'` | Type of cache storage ('memory', 'disk', or 'redis') |
| `storage.options.maxSize` | number | `50 * 1024 * 1024` | Maximum cache size in bytes (for memory cache) |
| `storage.options.path` | string | `'./.cache'` | Path to cache directory (for disk cache) |
| `storage.options.ttl` | number | `3600` | Default TTL in seconds for cached items |
| `rules` | array | `[]` | Array of caching rules |
| `rules[].pattern` | string | | URL pattern to apply the rule to (supports glob patterns) |
| `rules[].strategy` | string | `'cache-first'` | Caching strategy ('cache-first' or 'network-first') |
| `rules[].ttl` | number | | TTL in seconds for this rule (overrides default) |

## Implementation

### Plugin Class

```typescript
import { 
  Plugin, 
  PluginConfig, 
  RequestConfig, 
  Response, 
  PluginContext 
} from '@shc/core';
import * as crypto from 'crypto';

export class CachePlugin implements Plugin {
  private config: CacheConfig;
  private cacheStorage: CacheStorage;
  private stats: CacheStats;
  
  constructor() {
    // Default configuration
    this.config = {
      storage: {
        type: 'memory',
        options: {
          maxSize: 50 * 1024 * 1024, // 50MB
          ttl: 3600, // 1 hour
        },
      },
      rules: [],
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    // Initialize cache storage based on configuration
    this.cacheStorage = this.createCacheStorage();
    
    // Log initialization
    context.logger?.info('Cache plugin initialized');
  }
  
  /**
   * Configure the plugin
   */
  async onConfigure(config: PluginConfig): Promise<void> {
    // Merge configuration
    this.config = {
      ...this.config,
      ...config,
    };
    
    // Reinitialize cache storage if configuration changed
    this.cacheStorage = this.createCacheStorage();
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    // Only cache GET requests by default
    if (request.method !== 'GET') {
      return request;
    }
    
    // Find matching rule for the request
    const rule = this.findMatchingRule(request.url);
    
    if (!rule) {
      // No rule matches, skip caching
      return request;
    }
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Add cache key to request metadata
    request.meta = request.meta || {};
    request.meta.cacheKey = cacheKey;
    request.meta.cacheRule = rule;
    
    // Handle based on caching strategy
    if (rule.strategy === 'cache-first') {
      try {
        // Try to get from cache first
        const cachedResponse = await this.cacheStorage.get(cacheKey);
        
        if (cachedResponse) {
          // Cache hit
          this.stats.hits++;
          
          // Check if cached response is still valid
          if (this.isResponseValid(cachedResponse)) {
            // Return cached response
            throw new CacheHitError(cachedResponse);
          }
          
          // Add conditional headers if available
          if (cachedResponse.headers['etag']) {
            request.headers = request.headers || {};
            request.headers['If-None-Match'] = cachedResponse.headers['etag'];
          }
          
          if (cachedResponse.headers['last-modified']) {
            request.headers = request.headers || {};
            request.headers['If-Modified-Since'] = cachedResponse.headers['last-modified'];
          }
        } else {
          // Cache miss
          this.stats.misses++;
        }
      } catch (error) {
        if (error instanceof CacheHitError) {
          // Return cached response
          throw error;
        }
        
        // Cache error, continue with request
        this.stats.errors++;
      }
    }
    
    return request;
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Only cache GET requests by default
    if (request.method !== 'GET') {
      return response;
    }
    
    // Check if request has cache metadata
    if (!request.meta?.cacheKey || !request.meta?.cacheRule) {
      return response;
    }
    
    const cacheKey = request.meta.cacheKey as string;
    const rule = request.meta.cacheRule as CacheConfig['rules'][0];
    
    // Handle 304 Not Modified responses
    if (response.status === 304) {
      try {
        // Get from cache
        const cachedResponse = await this.cacheStorage.get(cacheKey);
        
        if (cachedResponse) {
          // Update cache TTL
          await this.cacheStorage.set(cacheKey, cachedResponse, rule.ttl);
          
          // Return cached response
          return cachedResponse;
        }
      } catch (error) {
        // Cache error, continue with response
        this.stats.errors++;
      }
    }
    
    // Check if response should be cached
    if (this.shouldCacheResponse(response)) {
      try {
        // Cache response
        await this.cacheStorage.set(cacheKey, response, rule.ttl);
      } catch (error) {
        // Cache error, continue with response
        this.stats.errors++;
      }
    }
    
    return response;
  }
  
  /**
   * Handle request error
   */
  async onError(error: Error, request: RequestConfig): Promise<Error> {
    // Check if this is a cache hit
    if (error instanceof CacheHitError) {
      // Return cached response
      return {
        response: error.response,
        isAxiosError: true,
        toJSON: () => ({}),
        name: '',
        message: '',
      } as any;
    }
    
    // Check if request has cache metadata
    if (!request.meta?.cacheKey || !request.meta?.cacheRule) {
      return error;
    }
    
    const cacheKey = request.meta.cacheKey as string;
    const rule = request.meta.cacheRule as CacheConfig['rules'][0];
    
    // Handle network-first strategy
    if (rule.strategy === 'network-first') {
      try {
        // Try to get from cache as fallback
        const cachedResponse = await this.cacheStorage.get(cacheKey);
        
        if (cachedResponse) {
          // Cache hit
          this.stats.hits++;
          
          // Return cached response
          return {
            response: cachedResponse,
            isAxiosError: true,
            toJSON: () => ({}),
            name: '',
            message: '',
          } as any;
        }
      } catch (cacheError) {
        // Cache error, continue with original error
        this.stats.errors++;
      }
    }
    
    return error;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    // Close cache storage
    await this.cacheStorage.close();
  }
  
  /**
   * Find matching rule for a URL
   */
  private findMatchingRule(url: string): CacheConfig['rules'][0] | null {
    for (const rule of this.config.rules) {
      if (this.matchesPattern(url, rule.pattern)) {
        return rule;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a URL matches a pattern
   */
  private matchesPattern(url: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    // Test URL against pattern
    return regex.test(url);
  }
  
  /**
   * Generate cache key for a request
   */
  private generateCacheKey(request: RequestConfig): string {
    // Create a string representation of the request
    const requestString = JSON.stringify({
      url: request.url,
      method: request.method,
      params: request.params,
      data: request.data,
      headers: this.filterHeaders(request.headers || {}),
    });
    
    // Generate hash
    return crypto.createHash('md5').update(requestString).digest('hex');
  }
  
  /**
   * Filter headers for cache key generation
   */
  private filterHeaders(headers: Record<string, string>): Record<string, string> {
    // Filter out headers that should not be part of the cache key
    const filteredHeaders: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      // Skip authorization and cache-related headers
      if (
        key.toLowerCase() !== 'authorization' &&
        key.toLowerCase() !== 'cache-control' &&
        key.toLowerCase() !== 'if-none-match' &&
        key.toLowerCase() !== 'if-modified-since'
      ) {
        filteredHeaders[key] = value;
      }
    }
    
    return filteredHeaders;
  }
  
  /**
   * Check if a response should be cached
   */
  private shouldCacheResponse(response: Response<any>): boolean {
    // Check status code (only cache successful responses)
    if (response.status < 200 || response.status >= 300) {
      return false;
    }
    
    // Check cache-control header
    const cacheControl = response.headers['cache-control'];
    
    if (cacheControl) {
      if (
        cacheControl.includes('no-store') ||
        cacheControl.includes('no-cache') ||
        cacheControl.includes('private')
      ) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if a cached response is still valid
   */
  private isResponseValid(response: Response<any>): boolean {
    // Check cache-control header
    const cacheControl = response.headers['cache-control'];
    
    if (cacheControl && cacheControl.includes('must-revalidate')) {
      return false;
    }
    
    // Check expires header
    const expires = response.headers['expires'];
    
    if (expires) {
      const expiresDate = new Date(expires);
      
      if (expiresDate < new Date()) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Create cache storage based on configuration
   */
  private createCacheStorage(): CacheStorage {
    switch (this.config.storage.type) {
      case 'disk':
        return new DiskCacheStorage(this.config.storage.options);
      case 'redis':
        return new RedisCacheStorage(this.config.storage.options);
      case 'memory':
      default:
        return new MemoryCacheStorage(this.config.storage.options);
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    await this.cacheStorage.clear();
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };
  }
}

/**
 * Cache hit error
 */
class CacheHitError extends Error {
  constructor(public response: Response<any>) {
    super('Cache hit');
    this.name = 'CacheHitError';
  }
}

/**
 * Cache storage interface
 */
interface CacheStorage {
  get(key: string): Promise<Response<any> | null>;
  set(key: string, response: Response<any>, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Cache statistics interface
 */
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
}

/**
 * Memory cache storage implementation
 */
class MemoryCacheStorage implements CacheStorage {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize: number;
  private currentSize: number = 0;
  private defaultTtl: number;
  
  constructor(options: CacheConfig['storage']['options']) {
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB
    this.defaultTtl = options.ttl || 3600; // 1 hour
  }
  
  async get(key: string): Promise<Response<any> | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (item.expiresAt < Date.now()) {
      // Remove expired item
      this.cache.delete(key);
      this.currentSize -= item.size;
      return null;
    }
    
    return item.response;
  }
  
  async set(key: string, response: Response<any>, ttl?: number): Promise<void> {
    // Calculate response size
    const responseString = JSON.stringify(response);
    const size = Buffer.byteLength(responseString, 'utf8');
    
    // Check if response is too large
    if (size > this.maxSize) {
      throw new Error('Response too large to cache');
    }
    
    // Remove existing item if it exists
    if (this.cache.has(key)) {
      const existingItem = this.cache.get(key)!;
      this.currentSize -= existingItem.size;
      this.cache.delete(key);
    }
    
    // Make room for new item if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      // Remove oldest item
      const oldestKey = this.findOldestItem();
      
      if (oldestKey) {
        const oldestItem = this.cache.get(oldestKey)!;
        this.currentSize -= oldestItem.size;
        this.cache.delete(oldestKey);
      }
    }
    
    // Add new item
    const expiresAt = Date.now() + ((ttl || this.defaultTtl) * 1000);
    
    this.cache.set(key, {
      response,
      size,
      createdAt: Date.now(),
      expiresAt,
    });
    
    this.currentSize += size;
  }
  
  async delete(key: string): Promise<void> {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      this.currentSize -= item.size;
      this.cache.delete(key);
    }
  }
  
  async clear(): Promise<void> {
    this.cache.clear();
    this.currentSize = 0;
  }
  
  async close(): Promise<void> {
    // No cleanup needed for memory cache
  }
  
  private findOldestItem(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.createdAt < oldestTime) {
        oldestKey = key;
        oldestTime = item.createdAt;
      }
    }
    
    return oldestKey;
  }
}

/**
 * Cache item interface
 */
interface CacheItem {
  response: Response<any>;
  size: number;
  createdAt: number;
  expiresAt: number;
}

/**
 * Disk cache storage implementation
 */
class DiskCacheStorage implements CacheStorage {
  private path: string;
  private defaultTtl: number;
  private fs: any;
  private fsPromises: any;
  
  constructor(options: CacheConfig['storage']['options']) {
    this.path = options.path || './.cache';
    this.defaultTtl = options.ttl || 3600; // 1 hour
    
    // Import fs modules
    this.fs = require('fs');
    this.fsPromises = require('fs').promises;
    
    // Create cache directory if it doesn't exist
    if (!this.fs.existsSync(this.path)) {
      this.fs.mkdirSync(this.path, { recursive: true });
    }
  }
  
  async get(key: string): Promise<Response<any> | null> {
    const filePath = this.getFilePath(key);
    
    try {
      // Check if file exists
      if (!this.fs.existsSync(filePath)) {
        return null;
      }
      
      // Read metadata file
      const metadataPath = `${filePath}.meta`;
      const metadataJson = await this.fsPromises.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataJson);
      
      // Check if item is expired
      if (metadata.expiresAt < Date.now()) {
        // Remove expired item
        await this.delete(key);
        return null;
      }
      
      // Read response file
      const responseJson = await this.fsPromises.readFile(filePath, 'utf8');
      const response = JSON.parse(responseJson);
      
      return response;
    } catch (error) {
      // Handle file read errors
      return null;
    }
  }
  
  async set(key: string, response: Response<any>, ttl?: number): Promise<void> {
    const filePath = this.getFilePath(key);
    
    try {
      // Write response file
      const responseJson = JSON.stringify(response);
      await this.fsPromises.writeFile(filePath, responseJson, 'utf8');
      
      // Write metadata file
      const metadata = {
        createdAt: Date.now(),
        expiresAt: Date.now() + ((ttl || this.defaultTtl) * 1000),
      };
      
      const metadataPath = `${filePath}.meta`;
      const metadataJson = JSON.stringify(metadata);
      await this.fsPromises.writeFile(metadataPath, metadataJson, 'utf8');
    } catch (error) {
      // Handle file write errors
      throw new Error(`Failed to write cache file: ${error.message}`);
    }
  }
  
  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const metadataPath = `${filePath}.meta`;
    
    try {
      // Delete files if they exist
      if (this.fs.existsSync(filePath)) {
        await this.fsPromises.unlink(filePath);
      }
      
      if (this.fs.existsSync(metadataPath)) {
        await this.fsPromises.unlink(metadataPath);
      }
    } catch (error) {
      // Handle file delete errors
      throw new Error(`Failed to delete cache file: ${error.message}`);
    }
  }
  
  async clear(): Promise<void> {
    try {
      // Read all files in cache directory
      const files = await this.fsPromises.readdir(this.path);
      
      // Delete all files
      for (const file of files) {
        await this.fsPromises.unlink(`${this.path}/${file}`);
      }
    } catch (error) {
      // Handle directory clear errors
      throw new Error(`Failed to clear cache directory: ${error.message}`);
    }
  }
  
  async close(): Promise<void> {
    // No cleanup needed for disk cache
  }
  
  private getFilePath(key: string): string {
    return `${this.path}/${key}`;
  }
}

/**
 * Redis cache storage implementation
 */
class RedisCacheStorage implements CacheStorage {
  private client: any;
  private defaultTtl: number;
  
  constructor(options: CacheConfig['storage']['options']) {
    this.defaultTtl = options.ttl || 3600; // 1 hour
    
    // Initialize Redis client
    const Redis = require('ioredis');
    this.client = new Redis(options);
  }
  
  async get(key: string): Promise<Response<any> | null> {
    try {
      // Get response from Redis
      const responseJson = await this.client.get(`shc:cache:${key}`);
      
      if (!responseJson) {
        return null;
      }
      
      // Parse response
      const response = JSON.parse(responseJson);
      
      return response;
    } catch (error) {
      // Handle Redis errors
      return null;
    }
  }
  
  async set(key: string, response: Response<any>, ttl?: number): Promise<void> {
    try {
      // Serialize response
      const responseJson = JSON.stringify(response);
      
      // Set in Redis with TTL
      await this.client.set(
        `shc:cache:${key}`,
        responseJson,
        'EX',
        ttl || this.defaultTtl
      );
    } catch (error) {
      // Handle Redis errors
      throw new Error(`Failed to set cache in Redis: ${error.message}`);
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      // Delete from Redis
      await this.client.del(`shc:cache:${key}`);
    } catch (error) {
      // Handle Redis errors
      throw new Error(`Failed to delete cache from Redis: ${error.message}`);
    }
  }
  
  async clear(): Promise<void> {
    try {
      // Delete all cache keys
      const keys = await this.client.keys('shc:cache:*');
      
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      // Handle Redis errors
      throw new Error(`Failed to clear cache in Redis: ${error.message}`);
    }
  }
  
  async close(): Promise<void> {
    // Close Redis client
    await this.client.quit();
  }
}
```

## Usage Example

```typescript
import { createSHCClient } from '@shc/core';
import { CachePlugin } from '@shc/plugins/cache';

// Create client with cache plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new CachePlugin(),
      config: {
        storage: {
          type: 'memory',
          options: {
            maxSize: 10 * 1024 * 1024, // 10MB
            ttl: 3600, // 1 hour
          },
        },
        rules: [
          {
            pattern: 'https://api.example.com/users/*',
            strategy: 'cache-first',
            ttl: 300, // 5 minutes
          },
          {
            pattern: 'https://api.example.com/*',
            strategy: 'network-first',
            ttl: 60, // 1 minute
          },
        ],
      },
    },
  ],
});

// Make a request - first time will hit the network
client.get('https://api.example.com/users/123')
  .then(response => {
    console.log('First request completed');
    
    // Make the same request again - will be served from cache
    return client.get('https://api.example.com/users/123');
  })
  .then(response => {
    console.log('Second request completed (from cache)');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

## Advanced Usage

### Accessing Cache Statistics

You can access cache statistics to monitor cache performance:

```typescript
import { createSHCClient } from '@shc/core';
import { CachePlugin } from '@shc/plugins/cache';

// Create cache plugin
const cachePlugin = new CachePlugin();

// Create client with cache plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: cachePlugin,
      config: {
        // Cache plugin configuration
      },
    },
  ],
});

// Make some requests
// ...

// Get cache statistics
const stats = cachePlugin.getStats();
console.log('Cache hits:', stats.hits);
console.log('Cache misses:', stats.misses);
console.log('Cache errors:', stats.errors);
```

### Clearing the Cache

You can clear the cache to remove all cached responses:

```typescript
import { createSHCClient } from '@shc/core';
import { CachePlugin } from '@shc/plugins/cache';

// Create cache plugin
const cachePlugin = new CachePlugin();

// Create client with cache plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: cachePlugin,
      config: {
        // Cache plugin configuration
      },
    },
  ],
});

// Clear the cache
await cachePlugin.clearCache();
```

## Implementation Requirements

The Cache Plugin implementation must follow these requirements:

1. **Performance**:
   - Efficient cache lookup and storage
   - Minimal impact on request/response performance
   - Optimized serialization/deserialization

2. **Memory Management**:
   - Proper cache size limiting
   - Efficient eviction strategies
   - Minimal memory overhead

3. **Correctness**:
   - Proper handling of HTTP caching semantics
   - Correct implementation of caching strategies
   - Accurate TTL enforcement

4. **Compatibility**:
   - Support for various response types
   - Proper handling of binary data
   - Compatibility with other plugins

5. **Robustness**:
   - Graceful handling of storage errors
   - Fallback mechanisms
   - No impact on request/response flow when cache fails

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
