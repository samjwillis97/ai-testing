import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CachePlugin from './index';
import CacheRequestHook from './request-hook';
import { CacheStrategy } from './types';

describe('CachePlugin', () => {
  // Mock console.log and fs.appendFile
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const fsSpy = vi.spyOn(CachePlugin, 'storeEntry').mockResolvedValue();
  
  beforeEach(() => {
    // Reset mocks before each test
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
    fsSpy.mockClear();
    
    // Reset plugin configuration to defaults
    CachePlugin.configure({
      storage: {
        type: 'memory',
        options: {
          maxSize: 100,
          ttl: 300,
        },
      },
      rules: [],
    });
    
    // Reset plugin state
    CachePlugin.memoryCache.clear();
    CachePlugin.stats = {
      hits: 0,
      misses: 0,
      stale: 0,
      size: 0,
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should have correct metadata', () => {
    expect(CachePlugin.name).toBe('cache-plugin');
    expect(CachePlugin.version).toBe('1.0.0');
  });
  
  it('should initialize correctly', async () => {
    await CachePlugin.initialize();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing cache-plugin'));
  });
  
  it('should configure with custom settings', async () => {
    const config = {
      storage: {
        type: 'disk' as const,
        options: {
          path: '/tmp/cache',
          maxSize: 1000,
        },
      },
      rules: [
        { pattern: '/api/test', strategy: 'cache-first' as CacheStrategy, ttl: 60 },
      ],
    };
    
    await CachePlugin.configure(config);
    
    expect(CachePlugin.config.storage.type).toBe('disk');
    expect(CachePlugin.config.storage.options.path).toBe('/tmp/cache');
    expect(CachePlugin.config.storage.options.maxSize).toBe(1000);
    expect(CachePlugin.config.rules).toHaveLength(1);
  });
  
  it('should cache responses when rules match', async () => {
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'cache-first', ttl: 60 },
      ],
    });
    
    const response = {
      data: { result: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        'etag': 'W/"123"',
      },
      config: {
        url: '/api/test',
        method: 'GET',
      },
    };
    
    const result = await CachePlugin.execute(response);
    
    // Should store the response in cache
    expect(fsSpy).toHaveBeenCalled();
    
    // Should return the response unmodified
    expect(result).toBe(response);
  });
  
  it('should not cache error responses', async () => {
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'cache-first', ttl: 60 },
      ],
    });
    
    const response = {
      data: { error: 'Not found' },
      status: 404,
      statusText: 'Not Found',
      headers: {
        'content-type': 'application/json',
      },
      config: {
        url: '/api/test',
        method: 'GET',
      },
    };
    
    const result = await CachePlugin.execute(response);
    
    // Should not store the response in cache
    expect(fsSpy).not.toHaveBeenCalled();
    
    // Should return the response unmodified
    expect(result).toBe(response);
  });
  
  it('should generate consistent cache keys', () => {
    const request1 = {
      url: '/api/test',
      method: 'GET',
      params: { id: 123 },
    };
    
    const request2 = {
      url: '/api/test',
      method: 'GET',
      params: { id: 123 },
    };
    
    const request3 = {
      url: '/api/test',
      method: 'GET',
      params: { id: 456 },
    };
    
    const key1 = CachePlugin.generateCacheKey(request1);
    const key2 = CachePlugin.generateCacheKey(request2);
    const key3 = CachePlugin.generateCacheKey(request3);
    
    // Same requests should generate the same key
    expect(key1).toBe(key2);
    
    // Different requests should generate different keys
    expect(key1).not.toBe(key3);
  });
  
  it('should validate cache entries correctly', () => {
    const now = Date.now();
    
    // Valid entry (not expired)
    const validEntry = {
      key: 'test1',
      url: '/api/test',
      method: 'GET',
      response: { data: 'test' },
      timestamp: now - 30000, // 30 seconds ago
      ttl: 60, // 60 seconds TTL
    };
    
    // Invalid entry (expired)
    const invalidEntry = {
      key: 'test2',
      url: '/api/test',
      method: 'GET',
      response: { data: 'test' },
      timestamp: now - 120000, // 120 seconds ago
      ttl: 60, // 60 seconds TTL
    };
    
    expect(CachePlugin.isCacheValid(validEntry)).toBe(true);
    expect(CachePlugin.isCacheValid(invalidEntry)).toBe(false);
  });
  
  it('should evict oldest entries when cache is full', () => {
    // Configure a small cache
    CachePlugin.configure({
      storage: {
        type: 'memory',
        options: {
          maxSize: 3,
        },
      },
    });
    
    // Add entries with different timestamps
    const now = Date.now();
    
    CachePlugin.memoryCache.set('key1', {
      key: 'key1',
      url: '/api/test/1',
      method: 'GET',
      response: { data: 'test1' },
      timestamp: now - 3000, // 3 seconds ago
      ttl: 60,
    });
    
    CachePlugin.memoryCache.set('key2', {
      key: 'key2',
      url: '/api/test/2',
      method: 'GET',
      response: { data: 'test2' },
      timestamp: now - 2000, // 2 seconds ago
      ttl: 60,
    });
    
    CachePlugin.memoryCache.set('key3', {
      key: 'key3',
      url: '/api/test/3',
      method: 'GET',
      response: { data: 'test3' },
      timestamp: now - 1000, // 1 second ago
      ttl: 60,
    });
    
    // Add a fourth entry, which should trigger eviction
    CachePlugin.memoryCache.set('key4', {
      key: 'key4',
      url: '/api/test/4',
      method: 'GET',
      response: { data: 'test4' },
      timestamp: now,
      ttl: 60,
    });
    
    // Manually trigger eviction
    CachePlugin.evictOldestEntries();
    
    // Should have evicted the oldest entry
    expect(CachePlugin.memoryCache.has('key1')).toBe(false);
    expect(CachePlugin.memoryCache.has('key2')).toBe(true);
    expect(CachePlugin.memoryCache.has('key3')).toBe(true);
    expect(CachePlugin.memoryCache.has('key4')).toBe(true);
  });
  
  it('should update statistics correctly', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'cache-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
    };
    
    const rule = CachePlugin.findMatchingRule(request);
    
    // First request - cache miss
    await CachePlugin.getCachedResponse(request, rule!);
    expect(CachePlugin.stats.misses).toBe(1);
    expect(CachePlugin.stats.hits).toBe(0);
    
    // Store a response in cache
    const cacheKey = CachePlugin.generateCacheKey(request);
    await CachePlugin.storeEntry({
      key: cacheKey,
      url: request.url,
      method: request.method,
      response: { data: 'test' },
      timestamp: Date.now(),
      ttl: 60,
    });
    
    // Second request - cache hit
    await CachePlugin.getCachedResponse(request, rule!);
    expect(CachePlugin.stats.misses).toBe(1);
    expect(CachePlugin.stats.hits).toBe(1);
    
    // Store a stale response
    await CachePlugin.storeEntry({
      key: cacheKey,
      url: request.url,
      method: request.method,
      response: { data: 'test' },
      timestamp: Date.now() - 120000, // 2 minutes ago
      ttl: 60, // 1 minute TTL
    });
    
    // Third request - stale cache
    await CachePlugin.getCachedResponse(request, rule!);
    expect(CachePlugin.stats.stale).toBe(1);
  });
});

describe('CacheRequestHook', () => {
  // Mock CachePlugin.getCachedResponse
  const getCachedResponseSpy = vi.spyOn(CachePlugin, 'getCachedResponse');
  
  beforeEach(() => {
    getCachedResponseSpy.mockClear();
    
    // Reset plugin configuration
    CachePlugin.configure({
      storage: {
        type: 'memory',
        options: {
          maxSize: 100,
          ttl: 300,
        },
      },
      rules: [],
    });
    
    // Reset plugin state
    CachePlugin.memoryCache.clear();
  });
  
  it('should have correct metadata', () => {
    expect(CacheRequestHook.name).toBe('cache-request-hook');
    expect(CacheRequestHook.version).toBe('1.0.0');
  });
  
  it('should pass through non-GET requests', async () => {
    const request = {
      url: '/api/test',
      method: 'POST',
      data: { test: 'data' },
    };
    
    const result = await CacheRequestHook.execute(request);
    
    // Should return the request unmodified
    expect(result).toBe(request);
    expect(getCachedResponseSpy).not.toHaveBeenCalled();
  });
  
  it('should handle cache-first strategy', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'cache-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
    };
    
    // Mock a cache hit
    getCachedResponseSpy.mockResolvedValueOnce({
      data: { result: 'cached' },
      status: 200,
    });
    
    const result = await CacheRequestHook.execute(request);
    
    // Should return the cached response
    expect(result).toEqual({
      data: { result: 'cached' },
      status: 200,
    });
    
    // Should have checked the cache
    expect(getCachedResponseSpy).toHaveBeenCalled();
  });
  
  it('should handle cache-first strategy with cache miss', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'cache-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
    };
    
    // Mock a cache miss
    getCachedResponseSpy.mockResolvedValueOnce(undefined);
    
    const result = await CacheRequestHook.execute(request);
    
    // Should return the request with cache rule
    expect(result).toBe(request);
    expect(result._cacheRule).toBeDefined();
    
    // Should have checked the cache
    expect(getCachedResponseSpy).toHaveBeenCalled();
  });
  
  it('should handle network-first strategy', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'network-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
    };
    
    const result = await CacheRequestHook.execute(request);
    
    // Should return the request with cache rule
    expect(result).toBe(request);
    expect(result._cacheRule).toBeDefined();
    
    // Should not have checked the cache for network-first
    expect(getCachedResponseSpy).not.toHaveBeenCalled();
  });
  
  it('should handle network errors for network-first strategy', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'network-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
      _cacheRule: { pattern: '/api/test', strategy: 'network-first', ttl: 60 },
    };
    
    const error = {
      message: 'Network Error',
      config: request,
    };
    
    // Mock a cache hit for fallback
    getCachedResponseSpy.mockResolvedValueOnce({
      data: { result: 'cached' },
      status: 200,
    });
    
    const result = await CacheRequestHook.handleNetworkError(error);
    
    // Should return the cached response
    expect(result).toEqual({
      data: { result: 'cached' },
      status: 200,
    });
    
    // Should have checked the cache
    expect(getCachedResponseSpy).toHaveBeenCalled();
  });
  
  it('should rethrow network errors when no cache is available', async () => {
    // Configure cache
    await CachePlugin.configure({
      rules: [
        { pattern: '/api/test', strategy: 'network-first', ttl: 60 },
      ],
    });
    
    const request = {
      url: '/api/test',
      method: 'GET',
      _cacheRule: { pattern: '/api/test', strategy: 'network-first', ttl: 60 },
    };
    
    const error = {
      message: 'Network Error',
      config: request,
    };
    
    // Mock a cache miss
    getCachedResponseSpy.mockResolvedValueOnce(undefined);
    
    // Should rethrow the error
    await expect(CacheRequestHook.handleNetworkError(error)).rejects.toBe(error);
  });
});
