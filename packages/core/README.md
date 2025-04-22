# Core HTTP Client

## Overview

The Core HTTP Client is a flexible, extensible HTTP client built on top of Axios, providing a robust interface for making HTTP requests with a powerful plugin system.

## Features

- Supports GET, POST, PUT, PATCH, and DELETE methods
- Configurable request options
- Powerful plugin system for extending functionality
- TypeScript support with strong typing
- Performance tracking

## Installation

```bash
npm install @samjwillis97/core
```

## Basic Usage

```typescript
import HttpClient from '@samjwillis97/core';

const client = new HttpClient('https://api.example.com');

// Simple GET request
const response = await client.get<User>('/users');
```

## Plugin System

The HTTP client supports a plugin system that allows you to extend its functionality through three main hooks:

### Pre-Request Plugin Hook

Modify the request configuration before the request is sent:

```typescript
const authPlugin: HttpClientPlugin = {
  onPreRequest: (config) => {
    // Add authentication headers
    const token = getAuthToken();
    config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  }
};
```

### Post-Request Plugin Hook

Transform or log the response after a successful request:

```typescript
const loggingPlugin: HttpClientPlugin = {
  onPostRequest: (response) => {
    // Log request details or transform response
    console.log('Request completed', response.status);
    return {
      ...response,
      data: camelCaseKeys(response.data)
    };
  }
};
```

### Error Plugin Hook

Handle or transform errors during the request:

```typescript
const errorHandlingPlugin: HttpClientPlugin = {
  onError: (error) => {
    // Custom error handling
    if (error.response?.status === 401) {
      refreshToken();
    }
    return error;
  }
};
```

## Registering Plugins

```typescript
const client = new HttpClient('https://api.example.com');

// Register multiple plugins
client.registerPlugin(authPlugin);
client.registerPlugin(loggingPlugin);
client.registerPlugin(errorHandlingPlugin);

// Make a request
const response = await client.get<User>('/users');
```

## API Reference

### `HttpClient`

#### Constructor
- `new HttpClient(baseURL?: string)`

#### Methods
- `get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>`
- `post<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>`
- `put<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>`
- `delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>`
- `patch<T>(url: string, data: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>`
- `registerPlugin(plugin: HttpClientPlugin): void`

## Performance Considerations

- Plugins are executed sequentially
- Minimal overhead with optional hooks
- Each plugin can modify or pass through the configuration/response

## Best Practices

1. Keep plugins focused and single-purpose
2. Avoid heavy processing in plugin hooks
3. Handle potential errors within plugins
4. Use type safety to ensure plugin compatibility

## License

MIT
