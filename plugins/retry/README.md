# SHC Retry Plugin

A plugin for Sam's HTTP Client that provides advanced retry capabilities with configurable backoff strategies and circuit breaker pattern implementation.

## Features

- Multiple retry strategies
- Configurable backoff algorithms (linear, exponential, fibonacci)
- Circuit breaker pattern support
- Comprehensive retry statistics
- Flexible retry conditions
- Network error handling
- Custom error type support

## Installation

```bash
pnpm add @shc/plugin-retry
```

## Usage

### Basic Usage

```typescript
import { SHCClient } from '@shc/core';
import { RetryPlugin } from '@shc/plugin-retry';

const client = new SHCClient();

const retryPlugin = new RetryPlugin({
  maxAttempts: 3,
  conditions: {
    statusCodes: [500, 502, 503, 504],
    networkErrors: true
  },
  backoff: {
    type: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000
  }
});

client.use(retryPlugin);
```

### With Circuit Breaker

```typescript
const retryPlugin = new RetryPlugin({
  maxAttempts: 3,
  conditions: {
    statusCodes: [500, 502, 503, 504],
    networkErrors: true
  },
  backoff: {
    type: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30000
  }
});
```

### Custom Error Types

```typescript
const retryPlugin = new RetryPlugin({
  maxAttempts: 3,
  conditions: {
    statusCodes: [500, 502, 503, 504],
    networkErrors: true,
    customErrors: ['RateLimitError', 'TimeoutError']
  },
  backoff: {
    type: 'fibonacci',
    baseDelay: 1000,
    maxDelay: 10000
  }
});
```

### Accessing Statistics

```typescript
const stats = retryPlugin.getStats();
console.log('Retry Statistics:', stats);
// {
//   totalRetries: 10,
//   successfulRetries: 8,
//   failedRetries: 2,
//   averageDelay: 2500,
//   circuitState: 'closed'
// }
```

## Configuration

### RetryConfig

| Option | Type | Description |
|--------|------|-------------|
| maxAttempts | number | Maximum number of retry attempts |
| conditions | RetryConditions | Conditions that trigger a retry |
| backoff | BackoffConfig | Backoff strategy configuration |
| circuitBreaker? | CircuitBreakerConfig | Optional circuit breaker configuration |

### RetryConditions

| Option | Type | Description |
|--------|------|-------------|
| statusCodes | number[] | HTTP status codes that trigger a retry |
| networkErrors | boolean | Whether to retry on network errors |
| customErrors? | string[] | Custom error types to retry on |

### BackoffConfig

| Option | Type | Description |
|--------|------|-------------|
| type | 'linear' \| 'exponential' \| 'fibonacci' | Backoff algorithm type |
| baseDelay | number | Base delay in milliseconds |
| maxDelay | number | Maximum delay in milliseconds |

### CircuitBreakerConfig

| Option | Type | Description |
|--------|------|-------------|
| failureThreshold | number | Number of failures before opening circuit |
| resetTimeout | number | Time in ms before attempting to close circuit |

## Backoff Strategies

### Linear Backoff
Delay increases linearly with each attempt:
- Attempt 1: baseDelay * 1
- Attempt 2: baseDelay * 2
- Attempt 3: baseDelay * 3

### Exponential Backoff
Delay increases exponentially with each attempt:
- Attempt 1: baseDelay * 2^0
- Attempt 2: baseDelay * 2^1
- Attempt 3: baseDelay * 2^2

### Fibonacci Backoff
Delay follows the Fibonacci sequence:
- Attempt 1: baseDelay * 1
- Attempt 2: baseDelay * 1
- Attempt 3: baseDelay * 2
- Attempt 4: baseDelay * 3
- Attempt 5: baseDelay * 5

## Circuit Breaker States

- **Closed**: Requests are allowed through normally
- **Open**: All requests are blocked
- **Half-Open**: Limited requests are allowed to test the system

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT 