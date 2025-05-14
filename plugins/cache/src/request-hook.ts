import { PluginType } from './types';
import CachePlugin from './index';

/**
 * Request Preprocessor Hook for the Cache Plugin
 * 
 * This hook implements cache-first and network-first strategies
 * by intercepting requests before they are sent.
 */
const CacheRequestHook = {
  name: 'cache-request-hook',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  
  // Plugin configuration - shared with the main plugin
  config: CachePlugin.config,
  
  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
  },
  
  // Plugin configuration - shared with the main plugin
  async configure(config: any): Promise<void> {
    // Configuration is shared with the main plugin
    this.config = CachePlugin.config;
  },
  
  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
  },
  
  // Plugin execution - processes requests before they are sent
  async execute(request: any): Promise<any> {
    // Only process GET requests
    if (request.method && request.method.toUpperCase() !== 'GET') {
      return request;
    }
    
    // Check if the request should be cached
    const rule = CachePlugin.findMatchingRule(request);
    
    if (!rule) {
      // No cache rule applies, let the request through
      return request;
    }
    
    // Handle based on cache strategy
    if (rule.strategy === 'cache-first') {
      // Try to get from cache first
      const cachedResponse = await CachePlugin.getCachedResponse(request, rule);
      
      if (cachedResponse) {
        // Return cached response and prevent the actual request
        return new Promise(resolve => {
          resolve(cachedResponse);
        });
      }
      
      // No cache hit, add cache headers to the request
      request.headers = request.headers || {};
      request._cacheRule = rule;
      
      return request;
    } else if (rule.strategy === 'network-first') {
      // Add cache rule to the request for potential fallback
      request._cacheRule = rule;
      
      // Add ETag if available
      const cacheKey = CachePlugin.generateCacheKey(request);
      const entry = await CachePlugin.retrieveEntry(cacheKey);
      
      if (entry && entry.etag) {
        request.headers = request.headers || {};
        request.headers['If-None-Match'] = entry.etag;
      }
      
      return request;
    }
    
    // Default: pass through
    return request;
  },
  
  // Handle network errors for network-first strategy
  async handleNetworkError(error: any): Promise<any> {
    // Check if the request has a cache rule
    const request = error.config;
    if (!request || !request._cacheRule) {
      throw error;
    }
    
    // Only handle network-first strategy
    if (request._cacheRule.strategy !== 'network-first') {
      throw error;
    }
    
    // Try to get from cache as fallback
    const cachedResponse = await CachePlugin.getCachedResponse(request, request._cacheRule);
    
    if (cachedResponse) {
      console.log(`Network error, using cached response for ${request.url}`);
      return cachedResponse;
    }
    
    // No cache hit, rethrow the error
    throw error;
  },
};

export default CacheRequestHook;
