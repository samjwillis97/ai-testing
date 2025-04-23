# Base Plugins Specification

## Overview

This document specifies the base plugins provided with SHC that serve as examples and building blocks for custom plugin development. These plugins demonstrate the full range of capabilities provided by the SHC plugin system.

## Plugin Categories

### 1. Request/Response Logging Plugin

A plugin that demonstrates pipeline hooks by providing comprehensive logging capabilities.

#### Features
- Request and response logging with configurable detail levels
- Multiple output targets (console, file, external services)
- Customizable log formats
- Request/response correlation
- Performance metrics logging

#### Configuration
```typescript
interface LoggingPluginConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  output: {
    type: 'console' | 'file' | 'service';
    options: {
      filePath?: string;
      serviceUrl?: string;
    };
  };
  format: {
    timestamp: boolean;
    includeHeaders: boolean;
    includeBody: boolean;
    maskSensitiveData: boolean;
  };
}
```

### 2. Request Rate Limiting Plugin

A plugin that demonstrates request flow control and queue management.

#### Features
- Per-endpoint and per-domain rate limiting
- Configurable rate limit rules
- Request queuing and prioritization
- Rate limit statistics and monitoring
- Distributed rate limiting support

#### Configuration
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

### 3. Response Cache Plugin

A plugin showcasing response handling and storage capabilities.

#### Features
- In-memory and disk-based caching
- Configurable cache strategies
- Cache invalidation rules
- Cache hit/miss statistics
- Support for cache headers (ETag, Cache-Control)

#### Configuration
```typescript
interface CacheConfig {
  storage: {
    type: 'memory' | 'disk' | 'redis';
    options: {
      maxSize?: number;
      path?: string;
      ttl?: number;
    };
  };
  rules: {
    pattern: string;
    strategy: 'cache-first' | 'network-first';
    ttl: number;
  }[];
}
```

### 4. Request Retry Plugin

A plugin demonstrating error handling and request manipulation.

#### Features
- Configurable retry strategies
- Multiple backoff algorithms
- Failure condition definitions
- Retry attempt logging
- Circuit breaker integration

#### Configuration
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

### 5. OAuth2 Authentication Plugin

A plugin showcasing authentication provider implementation.

#### Features
- Multiple OAuth2 flow support
- Token management
- Automatic token refresh
- Scope handling
- State management

#### Configuration
```typescript
interface OAuth2Config {
  flow: 'authorization_code' | 'client_credentials' | 'password';
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri?: string;
  autoRefresh: boolean;
}
```

### 6. Response Transform Plugin

A plugin demonstrating response transformation capabilities.

#### Features
- JSON path transformations
- XML to JSON conversion
- Data extraction
- Response formatting
- Schema validation

#### Configuration
```typescript
interface TransformConfig {
  rules: {
    contentType: string;
    transforms: {
      type: 'jsonPath' | 'xpath' | 'regex';
      expression: string;
      target: string;
    }[];
  }[];
  validation?: {
    schema: object;
    onError: 'throw' | 'warn' | 'ignore';
  };
}
```

### 7. Request Template Plugin

A plugin showcasing configuration extensions and template management.

#### Features
- Reusable request templates
- Variable substitution
- Template inheritance
- Environment variable integration
- Template validation

#### Configuration
```typescript
interface TemplateConfig {
  templates: {
    name: string;
    extends?: string;
    request: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: any;
    };
    variables: {
      name: string;
      type: 'string' | 'number' | 'boolean';
      required: boolean;
      default?: any;
    }[];
  }[];
}
```

## Plugin Development Guidelines

### Hook System Integration

Plugins can integrate with the following hook points:
- `beforeRequest`: Modify request before sending
- `afterRequest`: Process response after receiving
- `onError`: Handle request/response errors
- `onConfig`: Modify configuration
- `onInit`: Plugin initialization
- `onDestroy`: Plugin cleanup

### Best Practices

1. **Configuration**
   - Provide sensible defaults
   - Validate configuration on initialization
   - Document all configuration options
   - Support runtime configuration updates

2. **Error Handling**
   - Graceful error recovery
   - Detailed error messages
   - Error event emission
   - Debug logging

3. **Performance**
   - Minimize blocking operations
   - Implement caching where appropriate
   - Use async operations
   - Memory management

4. **Testing**
   - Unit tests for all features
   - Integration tests with SHC
   - Performance benchmarks
   - Error scenario testing

## Plugin Interface

```typescript
interface SHCPlugin {
  name: string;
  version: string;
  init(config: any): Promise<void>;
  destroy(): Promise<void>;
  hooks: {
    beforeRequest?: (request: Request) => Promise<Request>;
    afterRequest?: (response: Response) => Promise<Response>;
    onError?: (error: Error) => Promise<void>;
    onConfig?: (config: Config) => Promise<Config>;
  };
}
``` 