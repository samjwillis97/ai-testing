import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { PluginType } from './types';
import { CacheConfig, DEFAULT_CONFIG, CacheRule, StorageType } from './types';

/**
 * Interface for cache entries
 */
interface CacheEntry {
  key: string;
  url: string;
  method: string;
  response: any;
  timestamp: number;
  ttl: number;
  etag?: string;
  headers?: Record<string, string>;
}

/**
 * Response Cache Plugin for SHC
 * 
 * This plugin provides caching capabilities for responses with
 * configurable strategies and storage options.
 */
const CachePlugin = {
  name: 'cache-plugin',
  version: '1.0.0',
  type: PluginType.RESPONSE_TRANSFORMER,
  
  // Plugin configuration
  config: { ...DEFAULT_CONFIG },
  
  // Internal state
  memoryCache: new Map<string, CacheEntry>(),
  stats: {
    hits: 0,
    misses: 0,
    stale: 0,
    size: 0,
  },
  
  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
    
    // Create cache directory if using disk storage
    if (this.config.storage.type === 'disk' && this.config.storage.options.path) {
      await fs.mkdir(this.config.storage.options.path, { recursive: true }).catch((err: Error) => {
        console.error(`Failed to create cache directory: ${err.message}`);
      });
    }
  },
  
  // Plugin configuration
  async configure(config: Partial<CacheConfig>): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      storage: {
        ...DEFAULT_CONFIG.storage,
        ...config.storage,
        options: {
          ...DEFAULT_CONFIG.storage.options,
          ...config.storage?.options,
        },
      },
      rules: config.rules || DEFAULT_CONFIG.rules,
    };
    
    console.log(`Configured ${this.name} with ${this.config.rules.length} rules`);
    
    // Clear memory cache when configuration changes
    this.memoryCache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      size: 0,
    };
  },
  
  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
    this.memoryCache.clear();
  },
  
  // Plugin execution - processes responses after they are received
  async execute(response: any): Promise<any> {
    // Check if the response should be cached
    const rule = this.findMatchingRule(response.config);
    
    if (!rule) {
      // No cache rule applies, return the response unmodified
      return response;
    }
    
    // Store the response in cache
    await this.storeInCache(response, rule);
    
    // Return the response unmodified
    return response;
  },
  
  // Provided functions for template resolution
  providedFunctions: {
    // Get cache statistics
    getStats: {
      execute: async (): Promise<any> => {
        return { ...CachePlugin.stats };
      },
      parameters: [],
    },
    
    // Clear the cache
    clearCache: {
      execute: async (): Promise<void> => {
        CachePlugin.memoryCache.clear();
        CachePlugin.stats = {
          hits: 0,
          misses: 0,
          stale: 0,
          size: 0,
        };
        
        // Clear disk cache if using disk storage
        if (CachePlugin.config.storage.type === 'disk' && CachePlugin.config.storage.options.path) {
          try {
            const cacheDir = CachePlugin.config.storage.options.path;
            const files = await fs.readdir(cacheDir);
            
            for (const file of files) {
              if (file.endsWith('.cache')) {
                await fs.unlink(path.join(cacheDir, file));
              }
            }
          } catch (err) {
            console.error(`Failed to clear disk cache: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      },
      parameters: [],
    },
    
    // Add a new cache rule
    addRule: {
      execute: async (pattern: string, strategy: string, ttl: number): Promise<void> => {
        if (!['cache-first', 'network-first'].includes(strategy)) {
          throw new Error(`Invalid cache strategy: ${strategy}`);
        }
        
        CachePlugin.config.rules.push({
          pattern,
          strategy: strategy as any,
          ttl,
        });
      },
      parameters: ['pattern', 'strategy', 'ttl'],
    },
  },
  
  // Utility methods
  
  /**
   * Find the matching cache rule for a request
   */
  findMatchingRule(request: any): CacheRule | undefined {
    const url = request.url || '';
    
    // Find the first matching rule
    return this.config.rules.find(rule => {
      // Simple string match
      if (url.includes(rule.pattern)) {
        return true;
      }
      
      // Try as regex
      try {
        const regex = new RegExp(rule.pattern);
        return regex.test(url);
      } catch (e) {
        // Invalid regex, just use string comparison
        return false;
      }
    });
  },
  
  /**
   * Generate a cache key for a request
   */
  generateCacheKey(request: any): string {
    const { url, method, params, data } = request;
    
    // Create a string representation of the request
    const requestString = JSON.stringify({
      url,
      method: method || 'GET',
      params,
      data,
    });
    
    // Generate a hash of the request string
    return crypto.createHash('md5').update(requestString).digest('hex');
  },
  
  /**
   * Store a response in the cache
   */
  async storeInCache(response: any, rule: CacheRule): Promise<void> {
    // Don't cache error responses
    if (response.status >= 400) {
      return;
    }
    
    const request = response.config;
    const cacheKey = this.generateCacheKey(request);
    
    const entry: CacheEntry = {
      key: cacheKey,
      url: request.url,
      method: request.method || 'GET',
      response: {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
      timestamp: Date.now(),
      ttl: rule.ttl,
      etag: response.headers?.etag,
    };
    
    // Store in the appropriate cache
    await this.storeEntry(entry);
    
    // Update stats
    this.stats.size = this.memoryCache.size;
  },
  
  /**
   * Store a cache entry in the configured storage
   */
  async storeEntry(entry: CacheEntry): Promise<void> {
    switch (this.config.storage.type) {
      case 'memory':
        // Store in memory cache
        this.memoryCache.set(entry.key, entry);
        
        // Enforce max size if configured
        if (this.config.storage.options.maxSize && this.memoryCache.size > this.config.storage.options.maxSize) {
          this.evictOldestEntries();
        }
        break;
        
      case 'disk':
        // Store on disk
        if (this.config.storage.options.path) {
          try {
            const filePath = path.join(this.config.storage.options.path, `${entry.key}.cache`);
            await fs.writeFile(filePath, JSON.stringify(entry), 'utf8');
          } catch (err) {
            console.error(`Failed to write cache to disk: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
        break;
        
      case 'redis':
        // Redis implementation would go here
        console.warn('Redis cache storage not implemented yet');
        break;
    }
  },
  
  /**
   * Retrieve a cache entry from the configured storage
   */
  async retrieveEntry(key: string): Promise<CacheEntry | undefined> {
    switch (this.config.storage.type) {
      case 'memory':
        // Retrieve from memory cache
        return this.memoryCache.get(key);
        
      case 'disk':
        // Retrieve from disk
        if (this.config.storage.options.path) {
          try {
            const filePath = path.join(this.config.storage.options.path, `${key}.cache`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data) as CacheEntry;
          } catch (err) {
            // File not found or invalid JSON
            return undefined;
          }
        }
        return undefined;
        
      case 'redis':
        // Redis implementation would go here
        console.warn('Redis cache storage not implemented yet');
        return undefined;
        
      default:
        return undefined;
    }
  },
  
  /**
   * Check if a cache entry is still valid
   */
  isCacheValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiryTime = entry.timestamp + (entry.ttl * 1000);
    
    return now < expiryTime;
  },
  
  /**
   * Evict the oldest entries from the memory cache
   */
  evictOldestEntries(): void {
    // Convert to array for sorting
    const entries = Array.from(this.memoryCache.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove the oldest entries until we're under the limit
    const entriesToRemove = Math.ceil(entries.length * 0.2); // Remove 20% of entries
    
    for (let i = 0; i < entriesToRemove; i++) {
      if (entries[i]) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  },
  
  /**
   * Get a cached response for a request (used by the request preprocessor)
   */
  async getCachedResponse(request: any, rule: CacheRule): Promise<any | undefined> {
    const cacheKey = this.generateCacheKey(request);
    const entry = await this.retrieveEntry(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    if (!this.isCacheValid(entry)) {
      this.stats.stale++;
      
      // For cache-first strategy, return stale data with a warning
      if (rule.strategy === 'cache-first') {
        console.warn(`Using stale cache data for ${request.url}`);
        return entry.response;
      }
      
      return undefined;
    }
    
    // Cache hit
    this.stats.hits++;
    
    // Add cache headers to the response
    entry.response.headers = {
      ...entry.response.headers,
      'x-cache': 'HIT',
      'x-cache-timestamp': new Date(entry.timestamp).toISOString(),
    };
    
    return entry.response;
  },
};

export default CachePlugin;
