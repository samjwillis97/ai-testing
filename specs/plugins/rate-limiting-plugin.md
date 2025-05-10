# Request Rate Limiting Plugin

## Overview

The Request Rate Limiting Plugin demonstrates request flow control and queue management capabilities within the SHC plugin system. This plugin helps prevent API rate limit errors by controlling the rate at which requests are sent to specific endpoints or domains.

## Features

- Per-endpoint and per-domain rate limiting
- Configurable rate limit rules
- Request queuing and prioritization
- Rate limit statistics and monitoring
- Distributed rate limiting support

## Configuration

```typescript
interface RateLimitConfig {
  rules: {
    endpoint: string;
    limit: number;
    window: number; // in seconds
    priority?: number;
  }[];
  queueBehavior: 'drop' | 'delay';
  distributedLock?: {
    type: 'redis' | 'memory';
    options: Record<string, any>;
  };
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rules` | array | `[]` | Array of rate limit rules |
| `rules[].endpoint` | string | | Endpoint pattern to apply the rule to (supports glob patterns) |
| `rules[].limit` | number | | Maximum number of requests allowed in the window |
| `rules[].window` | number | | Time window in seconds |
| `rules[].priority` | number | `0` | Priority of the rule (higher values have higher priority) |
| `queueBehavior` | string | `'delay'` | Behavior when rate limit is exceeded ('drop' or 'delay') |
| `distributedLock` | object | | Configuration for distributed rate limiting |
| `distributedLock.type` | string | `'memory'` | Type of distributed lock ('redis' or 'memory') |
| `distributedLock.options` | object | `{}` | Options for the distributed lock |

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

export class RateLimitingPlugin implements Plugin {
  private config: RateLimitConfig;
  private buckets: Map<string, TokenBucket>;
  private queue: RequestQueue;
  private lockManager: LockManager;
  
  constructor() {
    // Default configuration
    this.config = {
      rules: [],
      queueBehavior: 'delay',
      distributedLock: {
        type: 'memory',
        options: {},
      },
    };
    
    this.buckets = new Map();
    this.queue = new RequestQueue();
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    // Initialize lock manager based on configuration
    this.lockManager = this.createLockManager();
    
    // Initialize token buckets for each rule
    for (const rule of this.config.rules) {
      this.buckets.set(rule.endpoint, new TokenBucket(rule.limit, rule.window));
    }
    
    // Start queue processing if behavior is 'delay'
    if (this.config.queueBehavior === 'delay') {
      this.startQueueProcessing();
    }
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
    
    // Reinitialize lock manager if configuration changed
    this.lockManager = this.createLockManager();
    
    // Reinitialize token buckets for each rule
    this.buckets.clear();
    for (const rule of this.config.rules) {
      this.buckets.set(rule.endpoint, new TokenBucket(rule.limit, rule.window));
    }
    
    // Restart queue processing if behavior is 'delay'
    if (this.config.queueBehavior === 'delay') {
      this.startQueueProcessing();
    }
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    // Find matching rule for the request
    const rule = this.findMatchingRule(request);
    
    if (!rule) {
      // No rule matches, allow the request
      return request;
    }
    
    // Get token bucket for the rule
    const bucket = this.buckets.get(rule.endpoint);
    
    if (!bucket) {
      // No bucket found, allow the request
      return request;
    }
    
    // Check if request can be processed
    const canProcess = await this.lockManager.acquireLock(rule.endpoint, async () => {
      return bucket.tryConsume();
    });
    
    if (canProcess) {
      // Request can be processed, allow it
      return request;
    }
    
    // Request cannot be processed, handle according to queue behavior
    if (this.config.queueBehavior === 'drop') {
      // Drop the request
      throw new Error(`Rate limit exceeded for endpoint ${rule.endpoint}`);
    } else {
      // Delay the request by adding it to the queue
      return new Promise((resolve, reject) => {
        this.queue.enqueue({
          request,
          rule,
          resolve,
          reject,
        });
      });
    }
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    // Stop queue processing
    this.stopQueueProcessing();
    
    // Clear buckets
    this.buckets.clear();
    
    // Close lock manager
    await this.lockManager.close();
  }
  
  /**
   * Find matching rule for a request
   */
  private findMatchingRule(request: RequestConfig): RateLimitConfig['rules'][0] | null {
    // Sort rules by priority (higher priority first)
    const sortedRules = [...this.config.rules].sort((a, b) => 
      (b.priority || 0) - (a.priority || 0)
    );
    
    // Find first matching rule
    for (const rule of sortedRules) {
      if (this.matchesEndpoint(request.url, rule.endpoint)) {
        return rule;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a URL matches an endpoint pattern
   */
  private matchesEndpoint(url: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    // Test URL against pattern
    return regex.test(url);
  }
  
  /**
   * Create lock manager based on configuration
   */
  private createLockManager(): LockManager {
    if (this.config.distributedLock?.type === 'redis') {
      return new RedisLockManager(this.config.distributedLock.options);
    } else {
      return new MemoryLockManager();
    }
  }
  
  /**
   * Start queue processing
   */
  private startQueueProcessing(): void {
    // Implementation for starting queue processing
  }
  
  /**
   * Stop queue processing
   */
  private stopQueueProcessing(): void {
    // Implementation for stopping queue processing
  }
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  
  constructor(capacity: number, refillWindow: number) {
    this.capacity = capacity;
    this.refillRate = capacity / refillWindow;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }
  
  /**
   * Try to consume a token
   */
  tryConsume(): boolean {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    
    return false;
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    
    if (elapsed > 0) {
      const tokensToAdd = elapsed * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
  
  /**
   * Get time until next token is available
   */
  getTimeUntilNextToken(): number {
    this.refill();
    
    if (this.tokens >= 1) {
      return 0;
    }
    
    return (1 - this.tokens) / this.refillRate * 1000;
  }
}

/**
 * Request queue for delayed requests
 */
class RequestQueue {
  private queue: QueueItem[] = [];
  private processing: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  
  /**
   * Add a request to the queue
   */
  enqueue(item: QueueItem): void {
    this.queue.push(item);
  }
  
  /**
   * Start processing the queue
   */
  startProcessing(buckets: Map<string, TokenBucket>, lockManager: LockManager): void {
    if (this.processing) {
      return;
    }
    
    this.processing = true;
    this.interval = setInterval(() => this.processQueue(buckets, lockManager), 100);
  }
  
  /**
   * Stop processing the queue
   */
  stopProcessing(): void {
    if (!this.processing) {
      return;
    }
    
    this.processing = false;
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  /**
   * Process the queue
   */
  private async processQueue(buckets: Map<string, TokenBucket>, lockManager: LockManager): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }
    
    // Sort queue by priority
    this.queue.sort((a, b) => (b.rule.priority || 0) - (a.rule.priority || 0));
    
    // Process queue items
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      const bucket = buckets.get(item.rule.endpoint);
      
      if (!bucket) {
        // No bucket found, resolve the request
        this.queue.splice(i, 1);
        item.resolve(item.request);
        i--;
        continue;
      }
      
      // Check if request can be processed
      const canProcess = await lockManager.acquireLock(item.rule.endpoint, async () => {
        return bucket.tryConsume();
      });
      
      if (canProcess) {
        // Request can be processed, resolve it
        this.queue.splice(i, 1);
        item.resolve(item.request);
        i--;
      }
    }
  }
}

/**
 * Queue item interface
 */
interface QueueItem {
  request: RequestConfig;
  rule: RateLimitConfig['rules'][0];
  resolve: (request: RequestConfig) => void;
  reject: (error: Error) => void;
}

/**
 * Lock manager interface
 */
interface LockManager {
  acquireLock<T>(key: string, fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * Memory lock manager implementation
 */
class MemoryLockManager implements LockManager {
  private locks: Map<string, boolean> = new Map();
  
  async acquireLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.locks.get(key)) {
      // Lock is already acquired, wait for it to be released
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!this.locks.get(key)) {
            clearInterval(interval);
            this.acquireLock(key, fn).then(resolve);
          }
        }, 10);
      });
    }
    
    // Acquire lock
    this.locks.set(key, true);
    
    try {
      // Execute function
      const result = await fn();
      return result;
    } finally {
      // Release lock
      this.locks.set(key, false);
    }
  }
  
  async close(): Promise<void> {
    // No cleanup needed for memory lock manager
  }
}

/**
 * Redis lock manager implementation
 */
class RedisLockManager implements LockManager {
  private client: any;
  
  constructor(options: Record<string, any>) {
    // Initialize Redis client
    const Redis = require('ioredis');
    this.client = new Redis(options);
  }
  
  async acquireLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const lockKey = `shc:ratelimit:lock:${key}`;
    const lockValue = Date.now().toString();
    
    // Try to acquire lock
    const acquired = await this.client.set(lockKey, lockValue, 'NX', 'PX', 1000);
    
    if (!acquired) {
      // Lock is already acquired, wait for it to be released
      await new Promise((resolve) => setTimeout(resolve, 10));
      return this.acquireLock(key, fn);
    }
    
    try {
      // Execute function
      const result = await fn();
      return result;
    } finally {
      // Release lock
      await this.client.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        1,
        lockKey,
        lockValue
      );
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
import { RateLimitingPlugin } from '@shc/plugins/rate-limiting';

// Create client with rate limiting plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new RateLimitingPlugin(),
      config: {
        rules: [
          {
            endpoint: 'https://api.example.com/users/*',
            limit: 10,
            window: 60, // 10 requests per minute
            priority: 1,
          },
          {
            endpoint: 'https://api.example.com/*',
            limit: 100,
            window: 60, // 100 requests per minute
            priority: 0,
          },
        ],
        queueBehavior: 'delay',
        distributedLock: {
          type: 'memory',
          options: {},
        },
      },
    },
  ],
});

// Make requests - they will be rate limited
for (let i = 0; i < 20; i++) {
  client.get('https://api.example.com/users/123')
    .then(response => {
      console.log(`Request ${i} completed`);
    })
    .catch(error => {
      console.error(`Request ${i} failed`, error);
    });
}
```

## Integration with Other Plugins

The Rate Limiting Plugin can be used in combination with other plugins. When multiple plugins are used, the order of plugin registration determines the order of execution:

```typescript
import { createSHCClient } from '@shc/core';
import { RateLimitingPlugin } from '@shc/plugins/rate-limiting';
import { LoggingPlugin } from '@shc/plugins/logging';

// Create client with multiple plugins
const client = createSHCClient({
  plugins: [
    {
      plugin: new LoggingPlugin(),
      config: {
        // Logging plugin configuration
      },
    },
    {
      plugin: new RateLimitingPlugin(),
      config: {
        // Rate limiting plugin configuration
      },
    },
  ],
});
```

In this example, the Logging Plugin will be executed before the Rate Limiting Plugin for requests, and after the Rate Limiting Plugin for responses. This means:

1. Request flow: LoggingPlugin.onRequest -> RateLimitingPlugin.onRequest -> HTTP Request
2. Response flow: HTTP Response -> RateLimitingPlugin.onResponse -> LoggingPlugin.onResponse

## Distributed Rate Limiting

The Rate Limiting Plugin supports distributed rate limiting using Redis. This allows multiple instances of the application to share the same rate limits:

```typescript
import { createSHCClient } from '@shc/core';
import { RateLimitingPlugin } from '@shc/plugins/rate-limiting';

// Create client with rate limiting plugin using Redis
const client = createSHCClient({
  plugins: [
    {
      plugin: new RateLimitingPlugin(),
      config: {
        rules: [
          {
            endpoint: 'https://api.example.com/*',
            limit: 100,
            window: 60, // 100 requests per minute
          },
        ],
        queueBehavior: 'delay',
        distributedLock: {
          type: 'redis',
          options: {
            host: 'localhost',
            port: 6379,
            password: 'password',
          },
        },
      },
    },
  ],
});
```

## Implementation Requirements

The Rate Limiting Plugin implementation must follow these requirements:

1. **Performance**:
   - Minimal impact on request/response performance
   - Efficient token bucket implementation
   - Optimized queue processing

2. **Accuracy**:
   - Precise rate limit enforcement
   - Proper handling of distributed scenarios
   - Accurate token refill timing

3. **Configurability**:
   - Flexible rule configuration
   - Multiple queue behaviors
   - Runtime configuration changes

4. **Robustness**:
   - Graceful handling of errors
   - Proper cleanup of resources
   - No memory leaks in long-running applications

5. **Scalability**:
   - Support for distributed rate limiting
   - Efficient lock management
   - Minimal resource usage

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage.
