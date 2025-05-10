# HTTP Client API Specification

## Overview

The HTTP Client API provides a robust and extensible interface for making HTTP requests. It is built on top of Axios and provides additional functionality through plugins and event handling.

## Interfaces

### SHCClient Interface

```typescript
export interface SHCClient {
  // Send HTTP requests
  request<T = any>(config: RequestConfig): Promise<Response<T>>;
  get<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  delete<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  head<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;
  options<T = any>(url: string, config?: RequestConfig): Promise<Response<T>>;

  // Configure defaults for all requests
  setDefaultHeader(name: string, value: string): void;
  setTimeout(timeout: number): void;
  setBaseURL(url: string): void;
  
  // Plugin management
  use(plugin: SHCPlugin): void;
  removePlugin(pluginName: string): void;
  
  // Event handling
  on(event: SHCEvent, handler: (...args: unknown[]) => void): void;
  off(event: SHCEvent, handler: (...args: unknown[]) => void): void;
  
  // Static factory method
  static create(config?: SHCConfig): SHCClient;
}
```

### Response Interface

```typescript
export interface Response<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  request?: any;
}
```

### RequestConfig Interface

```typescript
export interface RequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: any;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  auth?: {
    username: string;
    password: string;
  };
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream';
  responseEncoding?: string;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  maxContentLength?: number;
  maxBodyLength?: number;
  maxRedirects?: number;
  socketPath?: string | null;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    protocol?: string;
  } | false;
  decompress?: boolean;
  // Additional SHC-specific properties
  retry?: {
    attempts?: number;
    backoff?: 'linear' | 'exponential';
    initialDelay?: number;
  };
  cache?: {
    enabled?: boolean;
    ttl?: number;
    key?: string;
  };
}
```

### SHCConfig Interface

```typescript
export interface SHCConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  plugins?: SHCPlugin[];
  retry?: {
    attempts?: number;
    backoff?: 'linear' | 'exponential';
    initialDelay?: number;
  };
  storage?: {
    collections?: {
      path?: string;
      type?: 'file' | 'memory';
      autoload?: boolean;
    };
  };
  collections?: {
    items?: any[];
    files?: string[];
    directories?: string[];
  };
}
```

### SHCEvent Type

```typescript
export type SHCEvent = 
  | 'request'
  | 'response'
  | 'error'
  | 'retry'
  | 'plugin:registered'
  | 'plugin:removed'
  | 'plugin:error'
  | 'config:loaded'
  | 'collection:loaded'
  | 'collection:saved';
```

## Client Builder Pattern

The HTTP Client API supports a builder pattern for more flexible client configuration:

```typescript
export class SHCClientBuilder {
  private config: SHCConfig;
  private configManager: ConfigManager | null;
  private eventHandlers: Map<SHCEvent, (...args: unknown[]) => void>;
  
  constructor(config?: SHCConfig) {
    this.config = config || {};
    this.configManager = null;
    this.eventHandlers = new Map();
  }
  
  // Set configuration manager
  setConfigManager(configManager: ConfigManager): SHCClientBuilder {
    this.configManager = configManager;
    return this;
  }
  
  // Add event handler
  withEventHandler(event: SHCEvent, handler: (...args: unknown[]) => void): SHCClientBuilder {
    this.eventHandlers.set(event, handler);
    return this;
  }
  
  // Build the client
  build(): SHCClient {
    // Implementation details
    return client;
  }
}
```

## Examples

### Simple Client Creation

```typescript
import { SHCClient } from '@shc/core';

const client = SHCClient.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});
```

### Advanced Client Creation with Builder Pattern

```typescript
import { SHCClientBuilder, ConfigManager } from '@shc/core';

// Create a configuration manager
const configManager = new ConfigManager();
await configManager.loadFromFile('config.yaml');

// Create a client with the builder pattern
const client = new SHCClientBuilder({
  baseURL: 'https://api.example.com',
  timeout: 5000
})
  .setConfigManager(configManager)
  .withEventHandler('response', (response) => {
    console.log(`Received response with status ${response.status}`);
  })
  .withEventHandler('error', (error) => {
    console.error('Request failed:', error);
  })
  .build();
```

### Making Requests

```typescript
// Basic GET request
const response = await client.get('/users');

// GET request with parameters
const userResponse = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name'
  }
});

// POST request with data
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request with data
const updatedUser = await client.put('/users/123', {
  name: 'John Smith'
});

// DELETE request
await client.delete('/users/123');

// Request with custom headers
const response = await client.get('/protected-resource', {
  headers: {
    'Authorization': 'Bearer token123',
    'Accept': 'application/json'
  }
});

// Using TypeScript generics for type-safe responses
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const user = await client.get<User>('/users/123');
console.log(user.data.name); // TypeScript knows this is a string
```

### Event Handling

```typescript
// Listen for all responses
client.on('response', (response) => {
  console.log(`Received response with status ${response.status}`);
});

// Listen for errors
client.on('error', (error) => {
  console.error('Request failed:', error);
});

// Remove event listener
const errorHandler = (error) => {
  console.error('Request failed:', error);
};
client.on('error', errorHandler);
// Later...
client.off('error', errorHandler);
```

### Plugin Usage

```typescript
import { SHCClient, PluginType } from '@shc/core';
import { OAuth2Plugin } from '@shc/oauth2-plugin';

// Create a client with a plugin
const client = SHCClient.create({
  baseURL: 'https://api.example.com',
  plugins: [
    new OAuth2Plugin({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      tokenUrl: 'https://auth.example.com/oauth/token',
      scopes: ['read', 'write']
    })
  ]
});

// Add a plugin after client creation
const loggingPlugin = {
  name: 'request-logger',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  execute: async (request) => {
    console.log(`Making ${request.method} request to ${request.url}`);
    return request;
  }
};
client.use(loggingPlugin);

// Remove a plugin
client.removePlugin('request-logger');
```

## Error Handling

The HTTP Client API provides comprehensive error handling:

```typescript
try {
  const response = await client.get('/users/123');
  // Process successful response
} catch (error) {
  if (error.isAxiosError) {
    // Handle Axios-specific errors
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`Server error: ${error.response.status} - ${error.response.statusText}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
  } else if (error.pluginError) {
    // Handle plugin-specific errors
    console.error(`Plugin error in ${error.pluginError.plugin}: ${error.pluginError.error.message}`);
  } else {
    // Handle other errors
    console.error('Unknown error:', error);
  }
}
```

## Implementation Notes

1. The HTTP Client API is implemented using Axios as the underlying HTTP library.
2. Request and response interceptors are used to implement the plugin system.
3. The client uses the EventEmitter pattern for event handling.
4. TypeScript generics are used to provide type-safe responses.
5. The builder pattern is used to provide a flexible way to configure the client.
6. Error handling is comprehensive and includes plugin-specific errors.
7. The client supports both ESM and CommonJS module systems.
