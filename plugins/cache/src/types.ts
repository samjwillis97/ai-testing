/**
 * Cache storage type
 */
export type StorageType = 'memory' | 'disk' | 'redis';

/**
 * Cache strategy
 */
export type CacheStrategy = 'cache-first' | 'network-first';

/**
 * Cache storage configuration
 */
export interface CacheStorage {
  /**
   * Storage type
   */
  type: StorageType;
  
  /**
   * Storage options
   */
  options: {
    /**
     * Maximum cache size (in bytes for disk, number of items for memory)
     */
    maxSize?: number;
    
    /**
     * Path to cache directory (for disk storage)
     */
    path?: string;
    
    /**
     * Default TTL in seconds
     */
    ttl?: number;
  };
}

/**
 * Cache rule
 */
export interface CacheRule {
  /**
   * URL pattern to match
   * Can be a string or regex pattern
   */
  pattern: string;
  
  /**
   * Cache strategy
   */
  strategy: CacheStrategy;
  
  /**
   * Time-to-live in seconds
   */
  ttl: number;
}

/**
 * Cache plugin configuration
 */
export interface CacheConfig {
  /**
   * Cache storage configuration
   */
  storage: CacheStorage;
  
  /**
   * Cache rules
   */
  rules: CacheRule[];
}

/**
 * Default configuration for the cache plugin
 */
export const DEFAULT_CONFIG: CacheConfig = {
  storage: {
    type: 'memory',
    options: {
      maxSize: 100,
      ttl: 300, // 5 minutes
    },
  },
  rules: [],
};

/**
 * Plugin type enum
 */
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}
