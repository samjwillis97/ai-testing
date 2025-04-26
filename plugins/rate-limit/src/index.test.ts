import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RateLimitPlugin from './index';

describe('RateLimitPlugin', () => {
  // Mock console.log
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  beforeEach(() => {
    // Reset mocks before each test
    consoleSpy.mockClear();
    consoleWarnSpy.mockClear();
    
    // Reset plugin configuration to defaults
    RateLimitPlugin.configure({
      rules: [],
      queueBehavior: 'delay',
    });
    
    // Reset plugin state
    RateLimitPlugin.buckets.clear();
    RateLimitPlugin.requestQueue = [];
    RateLimitPlugin.processingQueue = false;
    RateLimitPlugin.stats = {
      totalProcessed: 0,
      totalLimited: 0,
      totalDropped: 0,
      queueLength: 0,
      ruleHits: new Map<string, number>(),
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should have correct metadata', () => {
    expect(RateLimitPlugin.name).toBe('rate-limit-plugin');
    expect(RateLimitPlugin.version).toBe('1.0.0');
  });
  
  it('should initialize correctly', async () => {
    await RateLimitPlugin.initialize();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Initializing rate-limit-plugin'));
  });
  
  it('should configure with custom settings', async () => {
    const config = {
      rules: [
        { endpoint: '/api/test', limit: 10, window: 60 },
        { endpoint: '/api/users', limit: 5, window: 30 },
      ],
      queueBehavior: 'drop' as const,
    };
    
    await RateLimitPlugin.configure(config);
    
    expect(RateLimitPlugin.config.rules).toHaveLength(2);
    expect(RateLimitPlugin.config.queueBehavior).toBe('drop');
    expect(RateLimitPlugin.buckets.size).toBe(2);
  });
  
  it('should let requests through when no rules match', async () => {
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/test', limit: 10, window: 60 },
      ],
    });
    
    const request = { url: '/api/other' };
    const result = await RateLimitPlugin.execute(request);
    
    expect(result).toBe(request);
    expect(RateLimitPlugin.stats.totalProcessed).toBe(1);
    expect(RateLimitPlugin.stats.totalLimited).toBe(0);
  });
  
  it('should rate limit requests when limit is reached', async () => {
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/test', limit: 2, window: 60 },
      ],
      queueBehavior: 'drop',
    });
    
    const request = { url: '/api/test' };
    
    // First request should go through
    const result1 = await RateLimitPlugin.execute(request);
    expect(result1).toBe(request);
    
    // Second request should go through
    const result2 = await RateLimitPlugin.execute(request);
    expect(result2).toBe(request);
    
    // Third request should be rate limited
    await expect(RateLimitPlugin.execute(request)).rejects.toThrow('Request rate limited');
    
    expect(RateLimitPlugin.stats.totalProcessed).toBe(3);
    expect(RateLimitPlugin.stats.totalLimited).toBe(1);
    expect(RateLimitPlugin.stats.totalDropped).toBe(1);
  });
  
  it('should queue requests when limit is reached and queueBehavior is delay', async () => {
    vi.useFakeTimers();
    
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/test', limit: 1, window: 1 }, // 1 request per second
      ],
      queueBehavior: 'delay',
    });
    
    const request = { url: '/api/test' };
    
    // First request should go through immediately
    const result1 = await RateLimitPlugin.execute(request);
    expect(result1).toBe(request);
    
    // Second request should be queued
    const promise = RateLimitPlugin.execute(request);
    
    // Queue should have one item
    expect(RateLimitPlugin.requestQueue).toHaveLength(1);
    expect(RateLimitPlugin.stats.queueLength).toBe(1);
    
    // Advance time to refill the bucket
    vi.advanceTimersByTime(1100); // Just over 1 second
    
    // Wait for the queued request to be processed
    const result2 = await promise;
    expect(result2).toBe(request);
    
    // Queue should be empty now
    expect(RateLimitPlugin.requestQueue).toHaveLength(0);
    expect(RateLimitPlugin.stats.queueLength).toBe(0);
    
    vi.useRealTimers();
  });
  
  it('should prioritize requests in the queue', async () => {
    vi.useFakeTimers();
    
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/low', limit: 1, window: 1, priority: 0 },
        { endpoint: '/api/high', limit: 1, window: 1, priority: 10 },
      ],
      queueBehavior: 'delay',
    });
    
    // Use up the token for both buckets
    await RateLimitPlugin.execute({ url: '/api/low' });
    await RateLimitPlugin.execute({ url: '/api/high' });
    
    // Queue a low priority request
    const lowPromise = RateLimitPlugin.execute({ url: '/api/low' });
    
    // Queue a high priority request
    const highPromise = RateLimitPlugin.execute({ url: '/api/high' });
    
    // Queue should have two items
    expect(RateLimitPlugin.requestQueue).toHaveLength(2);
    
    // Advance time to refill the buckets
    vi.advanceTimersByTime(1100); // Just over 1 second
    
    // Wait for the high priority request to be processed
    const highResult = await highPromise;
    expect(highResult).toEqual({ url: '/api/high' });
    
    // Advance time again for the low priority request
    vi.advanceTimersByTime(1100); // Just over 1 second
    
    // Wait for the low priority request to be processed
    const lowResult = await lowPromise;
    expect(lowResult).toEqual({ url: '/api/low' });
    
    vi.useRealTimers();
  });
  
  it('should refill tokens based on elapsed time', () => {
    vi.useFakeTimers();
    
    const now = Date.now();
    const bucket: any = {
      endpoint: '/api/test',
      tokens: 0,
      lastRefill: now - 30000, // 30 seconds ago
      window: 60, // 60 seconds window
      limit: 10, // 10 tokens max
    };
    
    // Refill the bucket
    RateLimitPlugin.refillBucket(bucket);
    
    // Should have refilled 5 tokens (30/60 * 10)
    expect(bucket.tokens).toBe(5);
    expect(bucket.lastRefill).toBe(now);
    
    // Advance time by full window
    vi.advanceTimersByTime(60000); // 60 seconds
    
    // Refill the bucket again
    RateLimitPlugin.refillBucket(bucket);
    
    // Should have refilled all tokens
    expect(bucket.tokens).toBe(10);
    
    vi.useRealTimers();
  });
  
  it('should reject all queued requests on destroy', async () => {
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/test', limit: 1, window: 60 },
      ],
      queueBehavior: 'delay',
    });
    
    // Use up the token
    await RateLimitPlugin.execute({ url: '/api/test' });
    
    // Queue some requests
    const promise1 = RateLimitPlugin.execute({ url: '/api/test' });
    const promise2 = RateLimitPlugin.execute({ url: '/api/test' });
    
    // Queue should have two items
    expect(RateLimitPlugin.requestQueue).toHaveLength(2);
    
    // Destroy the plugin
    await RateLimitPlugin.destroy();
    
    // Promises should be rejected
    await expect(promise1).rejects.toThrow('Plugin is shutting down');
    await expect(promise2).rejects.toThrow('Plugin is shutting down');
    
    // Queue should be empty
    expect(RateLimitPlugin.requestQueue).toHaveLength(0);
  });
  
  it('should update rule hit statistics', async () => {
    await RateLimitPlugin.configure({
      rules: [
        { endpoint: '/api/test', limit: 10, window: 60 },
        { endpoint: '/api/users', limit: 5, window: 30 },
      ],
    });
    
    // Send requests to different endpoints
    await RateLimitPlugin.execute({ url: '/api/test' });
    await RateLimitPlugin.execute({ url: '/api/test' });
    await RateLimitPlugin.execute({ url: '/api/users' });
    
    // Check rule hit statistics
    expect(RateLimitPlugin.stats.ruleHits.get('/api/test')).toBe(2);
    expect(RateLimitPlugin.stats.ruleHits.get('/api/users')).toBe(1);
    
    // Get stats via provided function
    const stats = await RateLimitPlugin.providedFunctions.getStats.execute();
    expect(stats.totalProcessed).toBe(3);
    expect(stats.ruleHits['/api/test']).toBe(2);
    expect(stats.ruleHits['/api/users']).toBe(1);
    
    // Reset stats
    await RateLimitPlugin.providedFunctions.resetStats.execute();
    expect(RateLimitPlugin.stats.totalProcessed).toBe(0);
    expect(RateLimitPlugin.stats.ruleHits.size).toBe(0);
  });
  
  it('should add new rules via provided function', async () => {
    // Add a rule via provided function
    await RateLimitPlugin.providedFunctions.addRule.execute('/api/new', 5, 30, 1);
    
    // Rule should be added to configuration
    expect(RateLimitPlugin.config.rules).toHaveLength(1);
    expect(RateLimitPlugin.config.rules[0]).toEqual({
      endpoint: '/api/new',
      limit: 5,
      window: 30,
      priority: 1,
    });
    
    // Bucket should be created
    expect(RateLimitPlugin.buckets.size).toBe(1);
  });
});
