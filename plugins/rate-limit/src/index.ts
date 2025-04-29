import { RateLimitConfig, DEFAULT_CONFIG, RateLimitRule, PluginType } from './types';

/**
 * Interface for tracking rate limit buckets
 */
interface RateBucket {
  endpoint: string;
  tokens: number;
  lastRefill: number;
  window: number;
  limit: number;
}

/**
 * Interface for queued requests
 */
interface QueuedRequest {
  request: Record<string, unknown>;
  rule: RateLimitRule;
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason?: Error) => void;
  timestamp: number;
  priority: number;
}

/**
 * Request Rate Limiting Plugin for SHC
 * 
 * This plugin demonstrates request flow control and queue management
 * with configurable rate limit rules.
 */
const RateLimitPlugin = {
  name: 'rate-limit-plugin',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  
  // Plugin configuration
  config: { ...DEFAULT_CONFIG },
  
  // Internal state
  buckets: new Map<string, RateBucket>(),
  requestQueue: [] as QueuedRequest[],
  processingQueue: false,
  
  // Statistics
  stats: {
    totalProcessed: 0,
    totalLimited: 0,
    totalDropped: 0,
    queueLength: 0,
    ruleHits: new Map<string, number>(),
  },
  
  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
    
    // Initialize buckets for each rule
    this.initializeBuckets();
  },
  
  // Plugin configuration
  async configure(config: Partial<RateLimitConfig>): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      rules: config.rules || DEFAULT_CONFIG.rules,
    };
    
    console.log(`Configured ${this.name} with ${this.config.rules.length} rules`);
    
    // Re-initialize buckets with new configuration
    this.initializeBuckets();
  },
  
  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
    
    // Clear any queued requests
    this.rejectAllQueuedRequests('Plugin is shutting down');
  },
  
  // Plugin execution - processes requests before they are sent
  async execute(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.stats.totalProcessed++;
    
    // Find matching rule for this request
    const rule = this.findMatchingRule(request);
    
    if (!rule) {
      // No rate limit rule applies, let the request through
      return request;
    }
    
    // Update rule hit statistics
    this.updateRuleStats(rule);
    
    // Check if request can proceed or needs to be rate limited
    const bucketKey = this.getBucketKey(rule);
    const bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      // Bucket not found (shouldn't happen), let the request through
      console.warn(`Rate limit bucket not found for rule: ${rule.endpoint}`);
      return request;
    }
    
    // Refill tokens if needed
    this.refillBucket(bucket);
    
    if (bucket.tokens > 0) {
      // Tokens available, consume one and let the request through
      bucket.tokens--;
      return request;
    }
    
    // No tokens available, rate limit the request
    this.stats.totalLimited++;
    
    // Handle based on queue behavior
    if (this.config.queueBehavior === 'drop') {
      // Drop the request
      this.stats.totalDropped++;
      throw new Error(`Request rate limited: ${rule.endpoint}`);
    } else {
      // Queue the request
      return this.queueRequest(request, rule);
    }
  },
  
  // Provided functions for template resolution
  providedFunctions: {
    // Get current rate limit statistics
    getStats: {
      execute: async (): Promise<Record<string, unknown>> => {
        return {
          ...RateLimitPlugin.stats,
          ruleHits: Object.fromEntries(RateLimitPlugin.stats.ruleHits.entries()),
          buckets: Array.from(RateLimitPlugin.buckets.entries()).map(([key, bucket]) => ({
            key,
            tokens: bucket.tokens,
            limit: bucket.limit,
            window: bucket.window,
          })),
        };
      },
      parameters: [],
    },
    
    // Reset rate limit statistics
    resetStats: {
      execute: async (): Promise<void> => {
        RateLimitPlugin.stats = {
          totalProcessed: 0,
          totalLimited: 0,
          totalDropped: 0,
          queueLength: 0,
          ruleHits: new Map<string, number>(),
        };
      },
      parameters: [],
    },
    
    // Add a new rate limit rule
    addRule: {
      execute: async (endpoint: string, limit: number, window: number, priority?: number): Promise<void> => {
        const newRule = { endpoint, limit, window, priority: priority || 0 };
        RateLimitPlugin.config.rules.push(newRule);
        RateLimitPlugin.initializeBuckets();
      },
      parameters: ['endpoint', 'limit', 'window', 'priority'],
    },
  },
  
  // Utility methods
  
  /**
   * Initialize rate limit buckets based on configuration
   */
  initializeBuckets(): void {
    // Clear existing buckets
    this.buckets.clear();
    
    // Create a bucket for each rule
    for (const rule of this.config.rules) {
      const bucketKey = this.getBucketKey(rule);
      this.buckets.set(bucketKey, {
        endpoint: rule.endpoint,
        tokens: rule.limit,
        lastRefill: Date.now(),
        window: rule.window,
        limit: rule.limit,
      });
    }
  },
  
  /**
   * Find the matching rate limit rule for a request
   */
  findMatchingRule(request: Record<string, unknown>): RateLimitRule | undefined {
    const url = typeof request.url === 'string' ? request.url : '';
    
    // Find the first matching rule
    return this.config.rules.find(rule => {
      // Simple string match
      if (url.includes(rule.endpoint)) {
        return true;
      }
      
      // Try as regex
      try {
        const regex = new RegExp(rule.endpoint);
        return regex.test(url);
      } catch {
        // Invalid regex, just use string comparison
        return false;
      }
    });
  },
  
  /**
   * Get a unique key for a rate limit bucket
   */
  getBucketKey(rule: RateLimitRule): string {
    return `${rule.endpoint}:${rule.limit}:${rule.window}`;
  },
  
  /**
   * Refill tokens in a rate bucket based on elapsed time
   */
  refillBucket(bucket: RateBucket): void {
    const now = Date.now();
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    
    if (elapsedSeconds >= bucket.window) {
      // Full window has passed, refill all tokens
      bucket.tokens = bucket.limit;
      bucket.lastRefill = now;
    } else if (elapsedSeconds > 0) {
      // Partially refill tokens based on elapsed time
      const tokensToAdd = Math.floor((elapsedSeconds / bucket.window) * bucket.limit);
      
      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(bucket.limit, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }
    }
  },
  
  /**
   * Queue a request for later processing
   */
  queueRequest(request: Record<string, unknown>, rule: RateLimitRule): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      // Add request to queue
      this.requestQueue.push({
        request,
        rule,
        resolve,
        reject,
        timestamp: Date.now(),
        priority: rule.priority || 0,
      });
      
      // Update queue length statistic
      this.stats.queueLength = this.requestQueue.length;
      
      // Start processing the queue if not already processing
      if (!this.processingQueue) {
        this.processQueue();
      }
    });
  },
  
  /**
   * Process the request queue
   */
  async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.processingQueue = false;
      return;
    }
    
    this.processingQueue = true;
    
    // Sort queue by priority (higher first) and then by timestamp (older first)
    this.requestQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Older requests first
    });
    
    // Process the first request in the queue
    const queuedRequest = this.requestQueue[0];
    const bucketKey = this.getBucketKey(queuedRequest.rule);
    const bucket = this.buckets.get(bucketKey);
    
    if (!bucket) {
      // Bucket not found, reject the request
      queuedRequest.reject(new Error(`Rate limit bucket not found for rule: ${queuedRequest.rule.endpoint}`));
      this.requestQueue.shift();
      this.stats.queueLength = this.requestQueue.length;
      setTimeout(() => this.processQueue(), 0);
      return;
    }
    
    // Refill tokens if needed
    this.refillBucket(bucket);
    
    if (bucket.tokens > 0) {
      // Tokens available, consume one and resolve the request
      bucket.tokens--;
      
      // Remove from queue
      this.requestQueue.shift();
      this.stats.queueLength = this.requestQueue.length;
      
      // Resolve with the original request
      queuedRequest.resolve(queuedRequest.request);
      
      // Continue processing the queue
      setTimeout(() => this.processQueue(), 0);
    } else {
      // No tokens available, wait and try again
      const timeToWait = Math.max(50, bucket.window * 1000 / bucket.limit);
      setTimeout(() => this.processQueue(), timeToWait);
    }
  },
  
  /**
   * Reject all queued requests
   */
  rejectAllQueuedRequests(reason: string): void {
    for (const queuedRequest of this.requestQueue) {
      queuedRequest.reject(new Error(reason));
    }
    
    this.requestQueue = [];
    this.stats.queueLength = 0;
    this.processingQueue = false;
  },
  
  /**
   * Update statistics for rule hits
   */
  updateRuleStats(rule: RateLimitRule): void {
    const endpoint = rule.endpoint;
    const currentHits = this.stats.ruleHits.get(endpoint) || 0;
    this.stats.ruleHits.set(endpoint, currentHits + 1);
  },
};

export default RateLimitPlugin;
