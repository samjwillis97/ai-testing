# @shc/core

Core functionality for Sam's HTTP Client - a powerful and extensible HTTP client with plugin support and advanced request management.

## Installation

```bash
npm install @shc/core
# or
pnpm add @shc/core
# or
yarn add @shc/core
```

## Features

- **HTTP Client API**: Axios-based HTTP client with support for all common methods
- **Plugin System**: Extensible plugin system for request preprocessing, response transformation, and authentication
- **Configuration Management**: YAML/JSON config loading with variable sets and environment management
- **Template Engine**: Template engine for variable substitution and function execution
- **Collection Management**: Support for organizing and managing API requests in collections

## Basic Usage

```typescript
import { createClient } from '@shc/core';

// Create a new client
const client = createClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Make a request
const response = await client.get('/users');
console.log(response.data);

// Use with plugins
import { RateLimitPlugin } from '@shc/rate-limit';

client.use(new RateLimitPlugin({
  limit: 10,
  interval: 60000 // 1 minute
}));

// Load from configuration
import { loadConfig } from '@shc/core';

const config = await loadConfig('./shc.config.yaml');
const configuredClient = createClient(config);
```

## Documentation

For more detailed documentation and examples, please see the full documentation.

## License

MIT