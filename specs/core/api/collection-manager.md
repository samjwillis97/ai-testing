# Collection Management API Specification

## Overview

The Collection Management API provides tools for organizing and managing HTTP requests, variable sets, and authentication configurations. It enables storing, retrieving, and executing collections of requests with variable substitution.

## Interfaces

### CollectionManager Interface

```typescript
export interface CollectionManager {
  // Collection operations
  loadCollection(path: string): Promise<Collection>;
  saveCollection(collection: Collection): Promise<void>;
  createCollection(name: string, config?: CollectionConfig): Promise<Collection>;
  deleteCollection(name: string): Promise<void>;
  
  // Request management
  addRequest(collection: string, request: Request): Promise<void>;
  updateRequest(collection: string, requestId: string, request: Request): Promise<void>;
  deleteRequest(collection: string, requestId: string): Promise<void>;
  
  // Global variable set management
  addGlobalVariableSet(variableSet: VariableSet): Promise<void>;
  updateGlobalVariableSet(name: string, variableSet: VariableSet): Promise<void>;
  getGlobalVariableSet(name: string): VariableSet;
  setGlobalVariableSetValue(setName: string, valueName: string): Promise<void>;
  
  // Collection variable set management
  addVariableSet(collection: string, variableSet: VariableSet): Promise<void>;
  updateVariableSet(collection: string, name: string, variableSet: VariableSet): Promise<void>;
  getVariableSet(collection: string, name: string): Promise<VariableSet>;
  setVariableSetValue(collection: string, setName: string, valueName: string): Promise<void>;
  
  // Request execution
  executeRequest(collection: string, requestId: string, options?: ExecuteOptions): Promise<Response>;
}

> **Note on Async/Sync Methods**: Methods that perform I/O operations (file system, network) are asynchronous, while methods that only access in-memory data (like `getGlobalVariableSet`) are synchronous. This follows the TypeScript best practice of using async/await only when necessary, improving performance and reducing unnecessary Promise overhead.
```

### Collection Interface

```typescript
export interface Collection {
  name: string;
  version: string;
  variableSets: VariableSet[];
  variableSetOverrides?: Record<string, string>;  // Maps variable set name to active value override
  requests: Request[];
  baseUrl?: string;
  authentication?: AuthConfig;
}
```

### Request Interface

```typescript
export interface Request {
  id: string;
  name: string;
  method: HTTPMethod;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  authentication?: AuthConfig;
  variables?: Record<string, any>;
}
```

### VariableSet Interface

```typescript
export interface VariableSet {
  name: string;
  description?: string;
  defaultValue?: string;
  activeValue: string;
  values: Record<string, Record<string, any>>;
}
```

### ExecuteOptions Interface

```typescript
export interface ExecuteOptions {
  variableOverrides?: Record<string, any>;
  timeout?: number;
}
```

### HTTPMethod Type

```typescript
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
```

## Examples

### Creating a Collection Manager

```typescript
import { createCollectionManager, SHCClient, ConfigManager } from '@shc/core';

// Create a client
const client = SHCClient.create({
  baseURL: 'https://api.example.com'
});

// Create a configuration manager
const configManager = new ConfigManager();
await configManager.loadFromFile('config.yaml');

// Create a collection manager
const collectionManager = createCollectionManager({
  storagePath: './collections',
  client,
  configManager
});
```

### Working with Collections

```typescript
// Create global variable sets
await collectionManager.addGlobalVariableSet({
  name: 'api',
  description: 'Global API configuration',
  defaultValue: 'development',
  activeValue: 'development',
  values: {
    development: {
      url: 'http://localhost:3000',
      timeout: 5000,
      debug: true
    },
    staging: {
      url: 'https://staging-api.example.com',
      timeout: 3000,
      debug: true
    },
    production: {
      url: 'https://api.example.com',
      timeout: 3000,
      debug: false
    }
  }
});

await collectionManager.addGlobalVariableSet({
  name: 'auth',
  description: 'Global authentication configuration',
  defaultValue: 'default',
  activeValue: 'default',
  values: {
    default: {
      tokenEndpoint: '/oauth/token',
      clientId: 'default-client',
      scopes: ['read', 'write']
    },
    admin: {
      tokenEndpoint: '/oauth/token',
      clientId: 'admin-client',
      scopes: ['read', 'write', 'admin']
    }
  }
});

// Create a new collection with variable sets and overrides
const newCollection = await collectionManager.createCollection('my-api', {
  baseUrl: 'https://api.example.com',
  // Override global variable set values at collection level
  variableSetOverrides: {
    'api': 'staging',     // Override global api variable set to use staging
    'auth': 'admin'       // Override global auth variable set to use admin
  },
  variableSets: [
    {
      name: 'user',
      description: 'User information for requests',
      defaultValue: 'john',
      activeValue: 'john',
      values: {
        john: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          apiKey: 'johns-api-key'
        },
        jane: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          apiKey: 'janes-api-key'
        }
      }
    }
  ]
});

// Load an existing collection
const loadedCollection = await collectionManager.loadCollection('./collections/my-collection.json');

// Save a collection
await collectionManager.saveCollection(newCollection);

// Delete a collection
await collectionManager.deleteCollection('my-api');
```

### Managing Requests

```typescript
// Add a request that uses both global and collection variable sets
await collectionManager.addRequest('my-api', {
  id: 'get-user-profile',
  name: 'Get User Profile',
  method: 'GET',
  path: '/users/profile',
  headers: {
    'Accept': 'application/json',
    'X-API-Key': '${variables.user.apiKey}',
    'X-User-Email': '${variables.user.email}'
  },
  query: {
    debug: '${variables.api.debug}',
    client_id: '${variables.auth.clientId}'
  }
});

// Add another request
await collectionManager.addRequest('my-api', {
  id: 'update-user',
  name: 'Update User',
  method: 'PUT',
  path: '/users/${variables.user.firstName}',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${variables.user.apiKey}'
  },
  body: {
    firstName: '${variables.user.firstName}',
    lastName: '${variables.user.lastName}',
    email: '${variables.user.email}'
  }
});

// Update a request
await collectionManager.updateRequest('my-api', 'get-user-profile', {
  id: 'get-user-profile',
  name: 'Get User Profile',
  method: 'GET',
  path: '/users/profile',
  headers: {
    'Accept': 'application/json',
    'X-API-Key': '${variables.user.apiKey}',
    'X-User-Email': '${variables.user.email}',
    'X-Tracking-ID': '${uuid.v4()}' // Added tracking header
  },
  query: {
    debug: '${variables.api.debug}',
    client_id: '${variables.auth.clientId}'
  }
});

// Delete a request
await collectionManager.deleteRequest('my-api', 'update-user');
```

### Managing Global Variable Sets

```typescript
// Add a global variable set
await collectionManager.addGlobalVariableSet({
  name: 'api',
  description: 'Global API configuration',
  defaultValue: 'development',
  activeValue: 'development',
  values: {
    development: {
      url: 'http://localhost:3000',
      timeout: 5000,
      debug: true
    },
    staging: {
      url: 'https://staging-api.example.com',
      timeout: 3000,
      debug: true
    },
    production: {
      url: 'https://api.example.com',
      timeout: 3000,
      debug: false
    }
  }
});

// Update a global variable set
const apiVariableSet = collectionManager.getGlobalVariableSet('api');
apiVariableSet.values.development.timeout = 10000;
await collectionManager.updateGlobalVariableSet('api', apiVariableSet);

// Set the active value for a global variable set
await collectionManager.setGlobalVariableSetValue('api', 'staging');
```

### Managing Collection Variable Sets

```typescript
// Add a variable set to a collection
await collectionManager.addVariableSet('My API Collection', {
  name: 'auth',
  description: 'Authentication configuration',
  defaultValue: 'user',
  activeValue: 'user',
  values: {
    user: {
      username: 'user1',
      password: 'password1',
      scopes: ['read']
    },
    admin: {
      username: 'admin',
      password: 'admin123',
      scopes: ['read', 'write', 'admin']
    }
  }
});

// Update a collection variable set
const authVariableSet = await collectionManager.getVariableSet('My API Collection', 'auth');
authVariableSet.values.user.scopes.push('write');
await collectionManager.updateVariableSet('My API Collection', 'auth', authVariableSet);

// Set the active value for a collection variable set
await collectionManager.setVariableSetValue('My API Collection', 'auth', 'admin');
```

### Executing Requests

```typescript
// Set global variable set value
await collectionManager.setGlobalVariableSetValue('api', 'production');

// Override global variable set value for specific collection
await collectionManager.setVariableSetValue('my-api', 'api', 'staging');

// Execute a request - it will use:
// - Collection's user variable set
// - Collection's override of api variable set (staging)
// - Collection's override of auth variable set (admin)
const response = await collectionManager.executeRequest('my-api', 'get-user-profile');
console.log(`Status: ${response.status}`);
console.log('Data:', response.data);

// Execute a request with variable overrides
const response2 = await collectionManager.executeRequest('my-api', 'get-user-profile', {
  variableOverrides: {
    // Override specific variables if needed
    'api.timeout': 10000,
    'user.apiKey': 'custom-api-key-for-this-request'
  },
  timeout: 15000
});

// Switch to a different user variable set
await collectionManager.setVariableSetValue('my-api', 'user', 'jane');

// Execute the request again - now using Jane's user information
const response3 = await collectionManager.executeRequest('my-api', 'get-user-profile');
```

## Collection File Format

Collections are stored in JSON format with the following structure:

```json
{
  "name": "My API Collection",
  "version": "1.0.0",
  "baseUrl": "https://api.example.com",
  "variableSets": [
    {
      "name": "auth",
      "description": "Authentication configuration",
      "defaultValue": "user",
      "activeValue": "user",
      "values": {
        "user": {
          "username": "user1",
          "password": "password1",
          "scopes": ["read"]
        },
        "admin": {
          "username": "admin",
          "password": "admin123",
          "scopes": ["read", "write", "admin"]
        }
      }
    }
  ],
  "variableSetOverrides": {
    "auth": "admin"
  },
  "requests": [
    {
      "id": "get-users",
      "name": "Get Users",
      "method": "GET",
      "path": "/users",
      "query": {
        "page": "1",
        "limit": "10"
      }
    },
    {
      "id": "create-user",
      "name": "Create User",
      "method": "POST",
      "path": "/users",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "authentication": {
    "type": "oauth2",
    "config": {
      "clientId": "${variables.auth.clientId}",
      "clientSecret": "${variables.auth.clientSecret}",
      "scopes": "${variables.auth.scopes}"
    }
  }
}
```

## Implementation Notes

1. The Collection Management API is implemented with a focus on flexibility and extensibility.
2. Collections are stored in JSON format by default, but the storage mechanism can be customized.
3. Variable substitution is performed using the Template Engine API.
4. Request execution is performed using the HTTP Client API.
5. Authentication is handled through the Plugin System API.
6. The API follows the TypeScript best practices specified in the project rules, including proper error handling and type safety.
7. Synchronous operations are used for in-memory data access, while asynchronous operations are used for I/O operations.
8. The API provides comprehensive error messages for operation failures.
