# Template Engine API Specification

## Overview

The Template Engine API provides a powerful system for resolving dynamic templates in configuration and requests. It supports various template sources, nested template resolution, and extensible function registration.

## Interfaces

### TemplateEngine Interface

```typescript
export class TemplateEngine {
  // Function registration
  registerFunction(namespace: string, func: TemplateFunction): void;
  getFunction(path: string): TemplateFunction | undefined;
  listFunctions(): string[];
  
  // Template resolution
  resolve(template: string, context: Partial<TemplateContext>): Promise<string>;
  resolveObject<T>(obj: T, context: Partial<TemplateContext>): Promise<T>;
}
```

### TemplateFunction Interface

```typescript
export interface TemplateFunction {
  name: string;
  description: string;
  execute: (...args: unknown[]) => Promise<unknown> | unknown;
  parameters?: Array<{
    name: string;
    type: TemplateFunctionType;
    description: string;
    required?: boolean;
    default?: unknown;
  }>;
}

export type TemplateFunctionType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';
```

### TemplateContext Interface

```typescript
export interface TemplateContext {
  env: Record<string, string>;
  config: Record<string, unknown>;
  variables: Record<string, unknown>;
  secrets: Record<string, string>;
  [key: string]: unknown;
}
```

## Template Syntax

The template engine supports the following syntax patterns:

### 1. Environment Variables

```
${env.VARIABLE_NAME}
```

### 2. Configuration Values

```
${config.path.to.value}
```

### 3. Variables

```
${variables.name}
```

### 4. Secrets

```
${secrets.SECRET_NAME}
```

### 5. Function Calls

```
${namespace.function(args)}
```

## Examples

### Creating a Template Engine

```typescript
import { createTemplateEngine } from '@shc/core';

// Create a template engine
const templateEngine = createTemplateEngine();
```

### Registering Template Functions

```typescript
// Register a simple function
templateEngine.registerFunction('math', {
  name: 'add',
  description: 'Add two numbers',
  execute: (a, b) => a + b,
  parameters: [
    {
      name: 'a',
      type: 'number',
      description: 'First number',
      required: true
    },
    {
      name: 'b',
      type: 'number',
      description: 'Second number',
      required: true
    }
  ]
});

// Register a function that returns a UUID
templateEngine.registerFunction('uuid', {
  name: 'v4',
  description: 'Generate a UUID v4',
  execute: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
});

// Register a function that returns the current date/time
templateEngine.registerFunction('datetime', {
  name: 'now',
  description: 'Get current ISO datetime',
  execute: () => new Date().toISOString()
});
```

### Resolving Template Strings

```typescript
// Resolve environment variables
const resolved1 = await templateEngine.resolve(
  'API URL: ${env.API_URL}', 
  { env: { API_URL: 'https://api.example.com' } }
);
// Result: 'API URL: https://api.example.com'

// Resolve configuration values
const resolved2 = await templateEngine.resolve(
  'Timeout: ${config.core.http.timeout}ms', 
  { config: { core: { http: { timeout: 5000 } } } }
);
// Result: 'Timeout: 5000ms'

// Resolve variables
const resolved3 = await templateEngine.resolve(
  'User: ${variables.username}', 
  { variables: { username: 'john.doe' } }
);
// Result: 'User: john.doe'

// Resolve secrets
const resolved4 = await templateEngine.resolve(
  'Authorization: Bearer ${secrets.API_TOKEN}', 
  { secrets: { API_TOKEN: 'abc123xyz' } }
);
// Result: 'Authorization: Bearer abc123xyz'

// Resolve function calls
const resolved5 = await templateEngine.resolve(
  'Request-ID: ${uuid.v4()}',
  {}
);
// Result: 'Request-ID: f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

### Resolving Nested Templates

```typescript
// Nested function calls
const resolved1 = await templateEngine.resolve(
  'Result: ${math.add(${math.double(2)}, 3)}',
  {}
);
// Result: 'Result: 7'

// Nested template references
const resolved2 = await templateEngine.resolve(
  'URL: ${env.API_URL}/${config.api.version}/users/${variables.userId}',
  {
    env: { API_URL: 'https://api.example.com' },
    config: { api: { version: 'v2' } },
    variables: { userId: '12345' }
  }
);
// Result: 'URL: https://api.example.com/v2/users/12345'
```

### Resolving Template Objects

```typescript
// Define a template object
const config = {
  url: '${env.API_URL}/users',
  headers: {
    'Authorization': 'Bearer ${secrets.API_TOKEN}',
    'X-Request-ID': '${uuid.v4()}'
  },
  timeout: '${config.core.http.timeout}'
};

// Create a context
const context = {
  env: { API_URL: 'https://api.example.com' },
  secrets: { API_TOKEN: 'abc123xyz' },
  config: { core: { http: { timeout: 5000 } } }
};

// Resolve the object
const resolved = await templateEngine.resolveObject(config, context);
// Result: {
//   url: 'https://api.example.com/users',
//   headers: {
//     'Authorization': 'Bearer abc123xyz',
//     'X-Request-ID': 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
//   },
//   timeout: 5000
// }
```

### Accessing Template Functions

```typescript
// Get a function by path
const addFunction = templateEngine.getFunction('math.add');
if (addFunction) {
  const result = await addFunction.execute(2, 3);
  console.log(`2 + 3 = ${result}`); // Output: 2 + 3 = 5
}

// List all registered functions
const functions = templateEngine.listFunctions();
console.log(`Registered functions: ${functions.join(', ')}`);
// Output: Registered functions: math.add, uuid.v4, datetime.now
```

## Creating Custom Template Functions

### Simple Function

```typescript
import { TemplateFunction } from '@shc/core';

// Create a simple template function
const doubleFunction: TemplateFunction = {
  name: 'double',
  description: 'Double a number',
  execute: (value) => {
    if (typeof value !== 'number') {
      throw new Error('Value must be a number');
    }
    return value * 2;
  },
  parameters: [
    {
      name: 'value',
      type: 'number',
      description: 'The number to double',
      required: true
    }
  ]
};

// Register the function
templateEngine.registerFunction('math', doubleFunction);
```

### Async Function

```typescript
import { TemplateFunction } from '@shc/core';
import axios from 'axios';

// Create an async template function
const fetchDataFunction: TemplateFunction = {
  name: 'fetch',
  description: 'Fetch data from an API',
  execute: async (url) => {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  },
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to fetch data from',
      required: true
    }
  ]
};

// Register the function
templateEngine.registerFunction('http', fetchDataFunction);
```

### Function with Multiple Parameters

```typescript
import { TemplateFunction } from '@shc/core';

// Create a template function with multiple parameters
const formatFunction: TemplateFunction = {
  name: 'format',
  description: 'Format a string with placeholders',
  execute: (template, ...args) => {
    if (typeof template !== 'string') {
      throw new Error('Template must be a string');
    }
    return template.replace(/{(\d+)}/g, (match, index) => {
      const argIndex = parseInt(index, 10);
      return argIndex < args.length ? String(args[argIndex]) : match;
    });
  },
  parameters: [
    {
      name: 'template',
      type: 'string',
      description: 'The template string with {0}, {1}, etc. placeholders',
      required: true
    },
    {
      name: 'args',
      type: 'any',
      description: 'Arguments to replace placeholders',
      required: false
    }
  ]
};

// Register the function
templateEngine.registerFunction('string', formatFunction);
```

## Implementation Notes

1. The Template Engine API is implemented with a focus on flexibility and extensibility.
2. Template resolution is performed in multiple passes to handle nested templates.
3. The API supports both synchronous and asynchronous template functions.
4. Template functions can be registered by plugins to extend the template engine.
5. The API follows the TypeScript best practices specified in the project rules, including proper error handling and type safety.
6. Template resolution is designed to be secure, with proper handling of sensitive information.
7. The API provides comprehensive error messages for template resolution failures.
