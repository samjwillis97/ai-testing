/// <reference lib="dom" />
import { CircuitBreaker } from './circuit-breaker';
import { RetryConfig, RetryStats } from './types';

export class RetryPlugin {
  private readonly config: RetryConfig;
  private readonly circuitBreaker?: CircuitBreaker;
  private stats: RetryStats;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      exponentialBackoff: config.exponentialBackoff ?? true,
      conditions: {
        statusCodes: config.conditions?.statusCodes ?? [],
        networkErrors: config.conditions?.networkErrors ?? true,
        customErrors: config.conditions?.customErrors ?? []
      },
      backoff: config.backoff ?? {
        type: 'exponential',
        baseDelay: 100,
        maxDelay: 1000
      },
      circuitBreaker: config.circuitBreaker
    };

    if (this.config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    }

    this.stats = {
      attempts: 0,
      startTime: 0,
      lastAttemptTime: 0,
      nextRetryDelay: 0,
      circuitState: 'CLOSED'
    };
  }

  /**
   * Execute a request with retry logic
   * @param request The request to execute
   * @returns The response from the request
   */
  public async execute<T>(request: () => Promise<T>): Promise<T> {
    this.stats.attempts = 0;
    this.stats.startTime = Date.now();

    let shouldContinue = true;
    while (shouldContinue) {
      this.stats.attempts++;
      this.stats.lastAttemptTime = Date.now();

      if (this.circuitBreaker) {
        if (this.circuitBreaker.isOpen()) {
          this.stats.circuitState = this.circuitBreaker.getState();
          throw new Error('Circuit breaker is open');
        }
      }

      try {
        const result = await request();
        
        if (this.circuitBreaker) {
          this.circuitBreaker.recordSuccess();
          this.stats.circuitState = this.circuitBreaker.getState();
        }
        
        shouldContinue = false;
        return result;
      } catch (error) {
        if (this.circuitBreaker) {
          this.circuitBreaker.recordFailure();
          this.stats.circuitState = this.circuitBreaker.getState();
        }

        if (!(error instanceof Error) || this.stats.attempts >= this.config.maxAttempts || !this.shouldRetry(error)) {
          shouldContinue = false;
          throw error;
        }

        const delayTime = this.getDelayTime(this.stats.attempts);
        this.stats.nextRetryDelay = delayTime;
        await new Promise(resolve => setTimeout(resolve, delayTime));
      }
    }

    throw new Error('Unexpected end of retry loop');
  }

  /**
   * Get current retry statistics
   */
  public getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * Reset the plugin state
   */
  public reset(): void {
    this.stats = {
      attempts: 0,
      startTime: 0,
      lastAttemptTime: 0,
      nextRetryDelay: 0,
      circuitState: 'CLOSED'
    };

    this.circuitBreaker?.reset();
  }

  /**
   * Determine if a request should be retried based on the error
   */
  private shouldRetry(error: Error): boolean {
    // Check for network errors
    if (this.config.conditions.networkErrors && this.isNetworkError(error)) {
      return true;
    }

    // Check for status code errors
    if (this.isStatusCodeError(error)) {
      return true;
    }

    // Check for custom errors
    if (this.isCustomError(error)) {
      return true;
    }

    return false;
  }

  /**
   * Check if an error is a network error
   */
  private isNetworkError(error: Error): boolean {
    return error.name === 'NetworkError' || error.name === 'MockNetworkError';
  }

  /**
   * Check if an error has a specific status code
   */
  private isStatusCodeError(error: Error & { status?: number }): boolean {
    if ('status' in error && typeof error.status === 'number') {
      return this.config.conditions.statusCodes.includes(error.status);
    }
    return false;
  }

  /**
   * Check if an error matches our custom error types
   */
  private isCustomError(error: Error): boolean {
    if (!this.config.conditions.customErrors) {
      return false;
    }
    return this.config.conditions.customErrors.some(errorType => 
      error.name === errorType || error.name === `Mock${errorType}`
    );
  }

  /**
   * Calculate delay time for retry attempt
   */
  private getDelayTime(attempt: number): number {
    const baseDelay = this.config.backoff?.baseDelay ?? 100;
    const maxDelay = this.config.backoff?.maxDelay ?? 1000;

    let delay: number;
    if (this.config.exponentialBackoff) {
      delay = baseDelay * Math.pow(2, attempt - 1);
    } else {
      delay = baseDelay;
    }

    return Math.min(delay, maxDelay);
  }
} 