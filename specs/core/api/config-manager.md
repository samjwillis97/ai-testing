# Configuration Management API Specification

## Overview

The Configuration Management API provides a robust system for loading, validating, and accessing configuration data. It includes schema validation using Zod, template resolution, and secret management.

## Interfaces

### ConfigManager Interface

```typescript
export interface ConfigManager {
  // Configuration loading
  loadFromFile(filePath: string): Promise<void>;
  loadFromString(content: string): Promise<void>;
  
  // Configuration access
  get<T>(path: string, defaultValue?: T): T;
  set(path: string, value: unknown): void;
  
  // Schema validation
  validateSchema(config: unknown): Promise<ValidationResult>;
  validateCurrentConfig(): Promise<ValidationResult>;
  validatePartialConfig(config: unknown): Promise<ValidationResult>;
  
  // Template resolution
  resolve(template: string, context?: Partial<TemplateContext>): Promise<string>;
  resolveObject<T>(obj: T, context?: Partial<TemplateContext>): Promise<T>;
  
  // Secret management
  setSecret(name: string, value: string): void;
  getSecret(name: string): string | undefined;
  hasSecret(name: string): boolean;
  
  // Environment variables
  getEnv(name: string, defaultValue?: string): string;
  getRequiredEnv(name: string): string;
  
  // Event handling
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}
```

### ValidationResult Interface

```typescript
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
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

## Schema Validation

The Configuration Management API uses Zod for schema validation:

```typescript
import { z } from 'zod';

// Schema definition for configuration
export const configSchema = z.object({
  version: z.string(),
  name: z.string().default('Default SHC Configuration'),
  core: z.object({
    http: z.object({
      timeout: z.number().int().positive().default(30000),
      max_redirects: z.number().int().nonnegative().default(5),
      retry: z.object({
        attempts: z.number().int().nonnegative().default(3),
        backoff: z.enum(['linear', 'exponential']).default('exponential')
      }).default({}),
      tls: z.object({
        verify: z.boolean().default(true)
      }).default({})
    }).default({}),
    logging: z.object({
      level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
      format: z.enum(['text', 'json']).default('text'),
      output: z.enum(['console', 'file']).default('console')
    }).default({})
  }).default({}),
  variable_sets: z.object({
    global: z.record(z.any()).default({}),
    collection_defaults: z.record(z.any()).default({}),
    request_overrides: z.record(z.any()).default({})
  }).default({}),
  plugins: z.object({
    auth: z.array(pluginConfigSchema).default([]),
    preprocessors: z.array(pluginConfigSchema).default([]),
    transformers: z.array(pluginConfigSchema).default([])
  }).default({}),
  storage: z.object({
    collections: z.object({
      type: z.enum(['file', 'memory']).default('file'),
      path: z.string().default('./collections'),
      autoload: z.boolean().optional()
    }).default({})
  }).default({}),
  collections: z.object({
    items: z.array(z.any()).default([]),
    files: z.array(z.string()).default([]),
    directories: z.array(z.string()).default([])
  }).optional()
});

// Type inference from schema
export type SHCConfigSchema = z.infer<typeof configSchema>;
```

## Examples

### Loading Configuration

```typescript
import { ConfigManager } from '@shc/core';

// Create a configuration manager
const config = new ConfigManager();

// Load configuration from file
await config.loadFromFile('config.yaml');

// Load configuration from string
const yamlContent = `
version: '1.0.0'
name: 'My API Client'
core:
  http:
    timeout: 5000
`;
await config.loadFromString(yamlContent);
```

### Accessing Configuration

```typescript
// Get a configuration value
const timeout = config.get<number>('core.http.timeout');
console.log(`Timeout: ${timeout}ms`);

// Get a configuration value with default
const maxRedirects = config.get<number>('core.http.max_redirects', 5);

// Set a configuration value
config.set('core.http.timeout', 10000);
```

### Validating Configuration

```typescript
// Validate a configuration object
const configObject = {
  version: '1.0.0',
  core: {
    http: {
      timeout: 5000
    }
  }
};
const validationResult = await config.validateSchema(configObject);
if (!validationResult.valid) {
  console.error('Invalid configuration:', validationResult.errors);
}

// Validate the current configuration
const currentValidation = await config.validateCurrentConfig();
if (!currentValidation.valid) {
  console.error('Current configuration is invalid:', currentValidation.errors);
}

// Validate a partial configuration
const partialConfig = {
  core: {
    http: {
      timeout: 5000
    }
  }
};
const partialValidation = await config.validatePartialConfig(partialConfig);
```

### Template Resolution

```typescript
// Resolve a template string
const resolvedUrl = await config.resolve(
  'https://${env.API_HOST}/v1/users/${variables.userId}'
);

// Resolve a template object
const requestConfig = await config.resolveObject({
  url: '${env.API_URL}/users',
  headers: {
    'X-API-Key': '${secrets.API_KEY}',
    'X-Request-ID': '${uuid.v4()}'
  },
  timeout: '${config.core.http.timeout}'
});
```

### Secret Management

```typescript
// Set a secret
config.setSecret('API_KEY', 'your-api-key');

// Get a secret
const apiKey = config.getSecret('API_KEY');
console.log(`API Key: ${apiKey}`);

// Check if a secret exists
if (config.hasSecret('API_KEY')) {
  console.log('API Key is set');
}
```

### Environment Variables

```typescript
// Get an environment variable
const apiHost = config.getEnv('API_HOST', 'localhost');
console.log(`API Host: ${apiHost}`);

// Get a required environment variable
try {
  const requiredVar = config.getRequiredEnv('DATABASE_URL');
  console.log(`Database URL: ${requiredVar}`);
} catch (error) {
  console.error('Missing required environment variable:', error.message);
}
```

### Event Handling

```typescript
// Listen for configuration loading
config.on('config:loaded', (loadedConfig) => {
  console.log('Configuration loaded:', loadedConfig.name);
});

// Listen for configuration changes
config.on('config:changed', (path, value) => {
  console.log(`Configuration changed: ${path} = ${value}`);
});
```

## Implementation Notes

1. The Configuration Management API is implemented using Zod for schema validation.
2. Template resolution is handled by a separate TemplateEngine class.
3. Secret management uses a secure in-memory store.
4. Environment variables are accessed through a controlled interface.
5. Configuration changes emit events that can be listened for.
6. The API supports both synchronous and asynchronous operations.
7. TypeScript is used for type safety and inference from schemas.
8. The API follows the TypeScript best practices specified in the project rules, including proper error handling and type safety.
