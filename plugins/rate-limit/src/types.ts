/**
 * Rate limiting rule configuration
 */
export interface RateLimitRule {
  /**
   * Endpoint pattern to apply the rule to
   * Can be a string or regex pattern
   */
  endpoint: string;
  
  /**
   * Number of requests allowed in the time window
   */
  limit: number;
  
  /**
   * Time window in seconds
   */
  window: number;
  
  /**
   * Priority of the request (higher priority requests are processed first)
   * @default 0
   */
  priority?: number;
}

/**
 * Queue behavior for rate-limited requests
 */
export type QueueBehavior = 'drop' | 'delay';

/**
 * Distributed lock type
 */
export type LockType = 'redis' | 'memory';

/**
 * Distributed lock configuration
 */
export interface DistributedLock {
  /**
   * Type of distributed lock
   */
  type: LockType;
  
  /**
   * Options for the distributed lock
   */
  options: Record<string, unknown>;
}

/**
 * Rate limiting plugin configuration
 */
export interface RateLimitConfig {
  /**
   * Rate limiting rules
   */
  rules: RateLimitRule[];
  
  /**
   * Queue behavior for rate-limited requests
   * @default 'delay'
   */
  queueBehavior: QueueBehavior;
  
  /**
   * Distributed lock configuration for multi-instance rate limiting
   * Optional, defaults to in-memory rate limiting
   */
  distributedLock?: DistributedLock;
}

/**
 * Default configuration for the rate limiting plugin
 */
export const DEFAULT_CONFIG: RateLimitConfig = {
  rules: [],
  queueBehavior: 'delay',
};

/**
 * Plugin type enum
 */
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}
