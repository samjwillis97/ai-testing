# SHC Core HTTP Client

## Overview
A robust, type-safe HTTP client built on top of Axios, providing a flexible interface for making HTTP requests.

## Features
- Support for GET, POST, PUT, DELETE, PATCH methods
- Comprehensive type definitions
- Advanced request configuration
- Detailed error handling
- Response time tracking

## Installation
```bash
npm install @shc/core
```

## Usage
```typescript
import { HttpClient } from '@shc/core';

const client = new HttpClient();

// GET request
const response = await client.get<User>('/users/1');

// POST request with options
const newUser = await client.post<User>('/users', userData, {
  headers: { 'Authorization': 'Bearer token' }
});
```

## Configuration
The HttpClient supports advanced configuration through constructor and method options.

### Request Options
- `headers`: Custom HTTP headers
- `queryParams`: URL query parameters
- `timeout`: Request timeout in milliseconds
- `proxy`: Proxy configuration

## Error Handling
Detailed error information is provided through the `HttpClientError` interface.

## License
MIT
