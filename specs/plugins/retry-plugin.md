# Request Retry Plugin

## Overview

The Request Retry Plugin demonstrates error handling and request manipulation capabilities within the SHC plugin system. This plugin improves reliability by automatically retrying failed requests based on configurable conditions and strategies.

## Features

- Configurable retry strategies
- Multiple backoff algorithms
- Failure condition definitions
- Retry attempt logging
- Circuit breaker integration

## Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;
  conditions: {
    statusCodes: number[];
    networkErrors: boolean;
    customErrors?: string[];
  };
  backoff: {
    type: 'linear' | 'exponential' | 'fibonacci';
    baseDelay: number;
    maxDelay: number;
  };
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxAttempts` | number | `3` | Maximum number of retry attempts |
| `conditions.statusCodes` | number[] | `[408, 429, 500, 502, 503, 504]` | HTTP status codes that trigger a retry |
| `conditions.networkErrors` | boolean | `true` | Whether to retry on network errors |
| `conditions.customErrors` | string[] | `[]` | Custom error messages that trigger a retry |
| `backoff.type` | string | `'exponential'` | Backoff algorithm type |
| `backoff.baseDelay` | number | `1000` | Base delay in milliseconds |
| `backoff.maxDelay` | number | `30000` | Maximum delay in milliseconds |
| `circuitBreaker.failureThreshold` | number | `5` | Number of failures before circuit opens |
| `circuitBreaker.resetTimeout` | number | `60000` | Time in milliseconds before circuit resets |

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

export class RetryPlugin implements Plugin {
  private config: RetryConfig;
  private circuitBreaker: CircuitBreaker | null = null;
  private logger: any;
  
  constructor() {
    // Default configuration
    this.config = {
      maxAttempts: 3,
      conditions: {
        statusCodes: [408, 429, 500, 502, 503, 504],
        networkErrors: true,
        customErrors: [],
      },
      backoff: {
        type: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
      },
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    this.logger = context.logger;
    
    // Initialize circuit breaker if configured
    if (this.config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(
        this.config.circuitBreaker.failureThreshold,
        this.config.circuitBreaker.resetTimeout
      );
    }
    
    this.logger?.info('Retry plugin initialized');
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
    
    // Reinitialize circuit breaker if configuration changed
    if (this.config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker(
        this.config.circuitBreaker.failureThreshold,
        this.config.circuitBreaker.resetTimeout
      );
    } else {
      this.circuitBreaker = null;
    }
    
    this.logger?.info('Retry plugin configured', { config: this.config });
  }
  
  /**
   * Handle request error
   */
  async onError(error: any, request: RequestConfig): Promise<any> {
    // Check if circuit breaker is open
    if (this.circuitBreaker && this.circuitBreaker.isOpen()) {
      this.logger?.warn('Circuit breaker is open, not retrying request');
      return error;
    }
    
    // Check if request has retry metadata
    const retryCount = request.meta?.retryCount || 0;
    
    // Check if we've reached the maximum number of attempts
    if (retryCount >= this.config.maxAttempts) {
      this.logger?.info(`Maximum retry attempts reached (${retryCount}), not retrying request`);
      
      // Record failure in circuit breaker
      if (this.circuitBreaker) {
        this.circuitBreaker.recordFailure();
      }
      
      return error;
    }
    
    // Check if the error is retryable
    if (!this.isRetryableError(error)) {
      this.logger?.info('Error is not retryable, not retrying request');
      return error;
    }
    
    // Calculate delay based on retry count and backoff strategy
    const delay = this.calculateDelay(retryCount);
    
    // Log retry attempt
    this.logger?.info(`Retrying request (attempt ${retryCount + 1} of ${this.config.maxAttempts}) after ${delay}ms delay`);
    
    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Update request metadata for the next attempt
    request.meta = request.meta || {};
    request.meta.retryCount = retryCount + 1;
    
    // Throw a special error to indicate that the request should be retried
    throw new RetryRequestError(request);
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Check if the response status code indicates a retry is needed
    if (this.config.conditions.statusCodes.includes(response.status)) {
      // Create an error object to be handled by onError
      const error = new Error(`Received status code ${response.status}`);
      (error as any).response = response;
      
      // Let onError handle the retry logic
      try {
        await this.onError(error, request);
      } catch (retryError) {
        if (retryError instanceof RetryRequestError) {
          // Throw the retry error to trigger a retry
          throw retryError;
        }
      }
    }
    
    // Record success in circuit breaker
    if (this.circuitBreaker) {
      this.circuitBreaker.recordSuccess();
    }
    
    return response;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    this.logger?.info('Retry plugin destroyed');
  }
  
  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Check for network errors
    if (this.config.conditions.networkErrors && this.isNetworkError(error)) {
      return true;
    }
    
    // Check for status code errors
    if (error.response && this.config.conditions.statusCodes.includes(error.response.status)) {
      return true;
    }
    
    // Check for custom errors
    if (this.config.conditions.customErrors && this.config.conditions.customErrors.length > 0) {
      const errorMessage = error.message || '';
      
      for (const customError of this.config.conditions.customErrors) {
        if (errorMessage.includes(customError)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if an error is a network error
   */
  private isNetworkError(error: any): boolean {
    // Check for common network error patterns
    return (
      !error.response &&
      Boolean(error.code) &&
      (
        error.code === 'ECONNABORTED' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ENETUNREACH' ||
        error.code === 'EHOSTUNREACH'
      )
    );
  }
  
  /**
   * Calculate delay based on retry count and backoff strategy
   */
  private calculateDelay(retryCount: number): number {
    const { type, baseDelay, maxDelay } = this.config.backoff;
    let delay: number;
    
    switch (type) {
      case 'linear':
        // Linear backoff: baseDelay * retryCount
        delay = baseDelay * (retryCount + 1);
        break;
        
      case 'fibonacci':
        // Fibonacci backoff: baseDelay * fibonacci(retryCount)
        delay = baseDelay * this.fibonacci(retryCount + 1);
        break;
        
      case 'exponential':
      default:
        // Exponential backoff: baseDelay * 2^retryCount
        delay = baseDelay * Math.pow(2, retryCount);
        break;
    }
    
    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * 0.2 * delay; // 20% jitter
    delay = delay + jitter;
    
    // Ensure delay doesn't exceed maxDelay
    return Math.min(delay, maxDelay);
  }
  
  /**
   * Calculate Fibonacci number
   */
  private fibonacci(n: number): number {
    if (n <= 1) return n;
    
    let prev = 0;
    let curr = 1;
    
    for (let i = 2; i <= n; i++) {
      const next = prev + curr;
      prev = curr;
      curr = next;
    }
    
    return curr;
  }
}

/**
 * Error thrown to indicate that a request should be retried
 */
class RetryRequestError extends Error {
  constructor(public request: RequestConfig) {
    super('Retry request');
    this.name = 'RetryRequestError';
  }
}

/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount: number = 0;
  private nextAttemptTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  
  constructor(failureThreshold: number, resetTimeout: number) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }
  
  /**
   * Check if the circuit breaker is open
   */
  isOpen(): boolean {
    // If in open state, check if it's time to try again
    if (this.state === 'open' && Date.now() >= this.nextAttemptTime) {
      this.state = 'half-open';
    }
    
    return this.state === 'open';
  }
  
  /**
   * Record a successful request
   */
  recordSuccess(): void {
    // If in half-open state, close the circuit
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
    
    // Reset failure count
    this.failureCount = 0;
  }
  
  /**
   * Record a failed request
   */
  recordFailure(): void {
    // Increment failure count
    this.failureCount++;
    
    // If in half-open state, open the circuit again
    if (this.state === 'half-open') {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
      return;
    }
    
    // If failure threshold is reached, open the circuit
    if (this.state === 'closed' && this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.resetTimeout;
    }
  }
  
  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.nextAttemptTime = 0;
  }
  
  /**
   * Get the current state of the circuit breaker
   */
  getState(): string {
    return this.state;
  }
}
```

## Usage Example

```typescript
import { createSHCClient } from '@shc/core';
import { RetryPlugin } from '@shc/plugins/retry';

// Create client with retry plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new RetryPlugin(),
      config: {
        maxAttempts: 3,
        conditions: {
          statusCodes: [429, 500, 502, 503, 504],
          networkErrors: true,
          customErrors: ['timeout', 'socket hang up'],
        },
        backoff: {
          type: 'exponential',
          baseDelay: 1000,
          maxDelay: 10000,
        },
        circuitBreaker: {
          failureThreshold: 5,
          resetTimeout: 30000,
        },
      },
    },
  ],
});

// Make a request - it will be retried if it fails
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request succeeded');
  })
  .catch(error => {
    console.error('Request failed after all retry attempts', error);
  });
```

## Backoff Strategies

The plugin supports three backoff strategies:

### Linear Backoff

With linear backoff, the delay increases linearly with each retry attempt:

```
delay = baseDelay * (retryCount + 1)
```

For example, with a base delay of 1000ms:
- 1st retry: 1000ms
- 2nd retry: 2000ms
- 3rd retry: 3000ms

### Exponential Backoff

With exponential backoff, the delay increases exponentially with each retry attempt:

```
delay = baseDelay * 2^retryCount
```

For example, with a base delay of 1000ms:
- 1st retry: 1000ms
- 2nd retry: 2000ms
- 3rd retry: 4000ms

### Fibonacci Backoff

With Fibonacci backoff, the delay follows the Fibonacci sequence:

```
delay = baseDelay * fibonacci(retryCount + 1)
```

For example, with a base delay of 1000ms:
- 1st retry: 1000ms
- 2nd retry: 2000ms
- 3rd retry: 3000ms
- 4th retry: 5000ms
- 5th retry: 8000ms

## Circuit Breaker Pattern

The plugin implements the Circuit Breaker pattern to prevent repeated requests to a failing service. The circuit breaker has three states:

1. **Closed**: Requests are allowed to proceed normally.
2. **Open**: Requests are immediately rejected without attempting to call the service.
3. **Half-Open**: After the reset timeout, the next request is allowed through to test if the service has recovered.

The circuit breaker transitions between states based on the success or failure of requests:

- **Closed to Open**: When the number of consecutive failures reaches the failure threshold.
- **Open to Half-Open**: After the reset timeout has elapsed.
- **Half-Open to Closed**: When a request succeeds.
- **Half-Open to Open**: When a request fails.

## Integration with Other Plugins

The Retry Plugin can be used in combination with other plugins. When multiple plugins are used, the order of plugin registration determines the order of execution:

```typescript
import { createSHCClient } from '@shc/core';
import { RetryPlugin } from '@shc/plugins/retry';
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
      plugin: new RetryPlugin(),
      config: {
        // Retry plugin configuration
      },
    },
  ],
});
```

In this example, the Logging Plugin will be executed before the Retry Plugin for requests, and after the Retry Plugin for responses. This means:

1. Request flow: LoggingPlugin.onRequest -> RetryPlugin.onRequest -> HTTP Request
2. Response flow: HTTP Response -> RetryPlugin.onResponse -> LoggingPlugin.onResponse
3. Error flow: HTTP Error -> RetryPlugin.onError -> LoggingPlugin.onError

If the Retry Plugin decides to retry a request, the entire plugin chain will be executed again for the retry attempt.

## Implementation Requirements

The Retry Plugin implementation must follow these requirements:

1. **Correctness**:
   - Proper implementation of backoff strategies
   - Accurate retry condition evaluation
   - Correct circuit breaker state transitions

2. **Performance**:
   - Minimal overhead for successful requests
   - Efficient retry decision making
   - Proper handling of timeouts

3. **Robustness**:
   - Graceful handling of edge cases
   - Proper cleanup of resources
   - No memory leaks in long-running applications

4. **Configurability**:
   - Flexible configuration options
   - Sensible defaults
   - Runtime configuration changes

5. **Observability**:
   - Proper logging of retry attempts
   - Circuit breaker state visibility
   - Retry statistics

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
