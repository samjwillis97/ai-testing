# Project Overview

## Core Components

### HTTP Client

The project includes a powerful, extensible HTTP client with a plugin system:

- Flexible request handling
- Plugin-based architecture
- TypeScript support
- Performance tracking

#### Plugin System Highlights

- **Pre-Request Hooks**: Modify request configurations
- **Post-Request Hooks**: Transform responses
- **Error Handling Hooks**: Centralized error management

```typescript
const authPlugin: HttpClientPlugin = {
  onPreRequest: (config) => {
    const token = getAuthToken();
    config.headers['Authorization'] = `Bearer ${token}`;
  }
};

const client = new HttpClient('https://api.example.com');
client.registerPlugin(authPlugin);
```

For detailed documentation, see [Core HTTP Client Specification](/specs/core-http-client.md)

## Project Structure

- `/packages/core`: Core utilities and HTTP client
- `/packages/auth`: Authentication services
- `/packages/cli`: Command-line interface
- `/specs`: Project specifications and documentation

## Getting Started

### Installation

```bash
npm install @samjwillis97/core
```

### Basic Usage

```typescript
import HttpClient from '@samjwillis97/core';

const client = new HttpClient('https://api.example.com');

// Simple GET request
const response = await client.get<User>('/users');
```

## Plugin System

The HTTP client supports a powerful plugin system with three main hooks:

### Pre-Request Plugin

Modify request configuration before sending:

```typescript
const loggingPlugin: HttpClientPlugin = {
  onPreRequest: (config) => {
    console.log('Sending request', config.url);
    config.headers['X-Request-ID'] = generateRequestId();
  }
};
```

### Post-Request Plugin

Transform or log responses:

```typescript
const transformPlugin: HttpClientPlugin = {
  onPostRequest: (response) => {
    return {
      ...response,
      data: camelCaseKeys(response.data)
    };
  }
};
```

### Error Handling Plugin

Centralize error management:

```typescript
const errorPlugin: HttpClientPlugin = {
  onError: (error) => {
    if (error.response?.status === 401) {
      refreshToken();
    }
    logErrorToMonitoringService(error);
  }
};
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT
