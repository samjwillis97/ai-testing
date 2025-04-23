/**
 * Type of backoff algorithm to use between retries
 */
export type BackoffType = 'linear' | 'exponential' | 'fibonacci';

/**
 * Configuration for the backoff strategy
 */
export interface BackoffConfig {
  /**
   * Type of backoff algorithm to use
   */
  type: BackoffType;
  /**
   * Base delay in milliseconds
   */
  baseDelay: number;
  /**
   * Maximum delay in milliseconds
   */
  maxDelay: number;
  /**
   * Whether to add random jitter to delays
   */
  jitter?: boolean;
}

/**
 * Configuration for the circuit breaker
 */
export interface CircuitBreakerConfig {
  /**
   * Number of failures before opening the circuit
   */
  failureThreshold: number;
  /**
   * Time in milliseconds before attempting to close the circuit
   */
  resetTimeout: number;
}

/**
 * Configuration for retry conditions
 */
export interface RetryConditions {
  /**
   * HTTP status codes that should trigger a retry
   */
  statusCodes: number[];
  /**
   * Whether to retry on network errors
   */
  networkErrors: boolean;
  /**
   * Custom error types to retry on
   */
  customErrors?: string[];
  /**
   * Custom function to determine if a retry should occur
   */
  customRetryCheck?: (error: Error) => boolean;
}

/**
 * Configuration for the retry plugin
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   */
  maxAttempts: number;
  /**
   * Base delay between retries in milliseconds
   */
  retryDelay?: number;
  /**
   * Whether to use exponential backoff
   */
  exponentialBackoff?: boolean;
  /**
   * Conditions that trigger a retry
   */
  conditions: RetryConditions;
  /**
   * Backoff strategy configuration
   */
  backoff: BackoffConfig;
  /**
   * Circuit breaker configuration (optional)
   */
  circuitBreaker?: CircuitBreakerConfig;
}

/**
 * State of the circuit breaker
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Statistics for retry operations
 */
export interface RetryStats {
  /**
   * Number of attempts made
   */
  attempts: number;
  /**
   * Time when retry sequence started
   */
  startTime: number;
  /**
   * Time of the last attempt
   */
  lastAttemptTime: number;
  /**
   * Delay until next retry attempt
   */
  nextRetryDelay: number;
  /**
   * Circuit breaker state
   */
  circuitState: CircuitState;
}

/**
 * Context for retry operations
 */
export interface RetryContext {
  stats: RetryStats;
  shouldRetry: boolean;
  error?: Error;
} 