# Plugin System API Specification

## Overview

The Plugin System API provides a flexible architecture for extending the core functionality through plugins. It supports dynamic loading of plugins from various sources, lifecycle management, and type-safe plugin interfaces.

## Interfaces

### PluginManager Interface

```typescript
export interface PluginManager {
  // Registration methods
  register(plugin: SHCPlugin): void;
  registerFromConfig(config: PluginConfig): Promise<void>;
  
  // Lifecycle management
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  
  // Plugin access
  getPlugin(name: string): SHCPlugin | undefined;
  listPlugins(): SHCPlugin[];
  isPluginEnabled(name: string): boolean;
  
  // Dynamic loading
  loadFromNpm(packageName: string, version?: string): Promise<void>;
  loadFromPath(pluginPath: string): Promise<void>;
  loadFromGit(url: string, ref?: string, options?: GitPluginOptions): Promise<void>;
  
  // Event handling
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}
```

### Plugin Interfaces

```typescript
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}

export interface SHCPlugin {
  // Required metadata
  name: string;
  version: string;
  type: PluginType;

  // Lifecycle hooks
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  configure?: (config: Record<string, unknown>) => Promise<void>;

  // Plugin-specific implementations based on type
  execute: (...args: unknown[]) => Promise<unknown>;

  // Optional provided functions for template resolution
  providedFunctions?: Record<
    string,
    {
      execute: (...args: unknown[]) => Promise<unknown>;
      parameters?: unknown[];
    }
  >;
}

export interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (...args: unknown[]) => Promise<unknown>;
}

export interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (...args: unknown[]) => Promise<unknown>;
}

export interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (...args: unknown[]) => Promise<unknown>;
  refresh?: (token: string) => Promise<unknown>;
  validate?: (token: string) => Promise<boolean>;
}
```

### Plugin Configuration Interface

```typescript
export interface PluginConfig {
  name: string;
  type: PluginType;
  source: {
    type: 'npm' | 'path' | 'git';
    location: string;
    version?: string;
    ref?: string;
    gitOptions?: GitPluginOptions;
  };
  options?: Record<string, unknown>;
  dependencies?: Array<{
    name: string;
    package: string;
  }>;
  permissions?: {
    filesystem?: {
      read?: string[];
      write?: string[];
    };
    network?: string[];
    env?: string[];
  };
}
```

### GitPluginOptions Interface

```typescript
export interface GitPluginOptions {
  // The branch, tag, or commit to checkout
  ref?: string;
  // The directory within the repository that contains the plugin
  directory?: string;
  // Authentication options for private repositories
  auth?: {
    username?: string;
    password?: string;
    token?: string;
  };
  // Whether to use shallow clone (faster but limited history)
  shallow?: boolean;
}
```

## Plugin Lifecycle

Plugins follow a defined lifecycle managed by the PluginManager:

1. **Registration**: Plugins are registered with the plugin manager, either directly or through configuration.
2. **Configuration**: If a plugin provides a `configure` method, it is called with the plugin-specific configuration.
3. **Initialization**: When the plugin manager's `initialize` method is called, all registered plugins' `initialize` methods are called.
4. **Execution**: During application runtime, plugins are executed as needed based on their type.
5. **Destruction**: When the plugin manager's `destroy` method is called, all registered plugins' `destroy` methods are called.

## Examples

### Creating a Plugin Manager

```typescript
import { createPluginManager, ConfigManager } from '@shc/core';

// Create a configuration manager
const configManager = new ConfigManager();
await configManager.loadFromFile('config.yaml');

// Create a plugin manager
const pluginManager = createPluginManager({ configManager });
```

### Registering a Plugin

```typescript
import { PluginType } from '@shc/core';

// Create a simple plugin
const loggingPlugin = {
  name: 'request-logger',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  execute: async (request) => {
    console.log(`Making ${request.method} request to ${request.url}`);
    return request;
  }
};

// Register the plugin
pluginManager.register(loggingPlugin);
```

### Registering a Plugin from Configuration

```typescript
// Register a plugin from configuration
await pluginManager.registerFromConfig({
  name: 'oauth2-provider',
  package: '@shc/oauth2-plugin',
  version: '^1.0.0',
  config: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    tokenUrl: 'https://auth.example.com/oauth/token',
    scopes: ['read', 'write']
  }
});
```

### Loading a Plugin from NPM

```typescript
// Load a plugin from NPM
await pluginManager.loadFromNpm('@shc/oauth2-plugin', '^1.0.0');
```

### Loading a Plugin from a Local Path

```typescript
// Load a plugin from a local path
await pluginManager.loadFromPath('./plugins/request-logger');
```

### Loading a Plugin from Git

```typescript
// Basic Git plugin loading
await pluginManager.loadFromGit(
  'https://github.com/shc/oauth2-plugin.git',
  'main'
);

// Advanced Git plugin loading with options
await pluginManager.loadFromGit(
  'https://github.com/shc/oauth2-plugin.git',
  'v1.2.0',
  {
    directory: 'packages/auth-provider',  // Load from a specific directory in the repo
    auth: {
      token: process.env.GITHUB_TOKEN    // Use authentication for private repos
    },
    shallow: true                        // Use shallow clone for faster loading
  }
);

// Loading from Git via configuration
await pluginManager.registerFromConfig({
  name: 'advanced-auth-provider',
  type: PluginType.AUTH_PROVIDER,
  source: {
    type: 'git',
    location: 'https://github.com/shc/plugins.git',
    ref: 'v2.0.0',
    gitOptions: {
      directory: 'auth/oauth2',
      shallow: true,
      auth: {
        token: '${env.GITHUB_TOKEN}'  // Template-based token from environment
      }
    }
  },
  options: {
    clientId: '${config.auth.clientId}',
    clientSecret: '${secrets.AUTH_SECRET}',
    tokenUrl: 'https://auth.example.com/oauth/token'
  }
});
```

### Initializing Plugins

```typescript
// Initialize all registered plugins
await pluginManager.initialize();
```

### Accessing Plugins

```typescript
// Get a plugin by name
const oauthPlugin = pluginManager.getPlugin('oauth2-provider');
if (oauthPlugin) {
  // Use the plugin
}

// List all plugins
const plugins = pluginManager.listPlugins();
console.log(`Registered plugins: ${plugins.map(p => p.name).join(', ')}`);

// Check if a plugin is enabled
if (pluginManager.isPluginEnabled('oauth2-provider')) {
  console.log('OAuth2 plugin is enabled');
}
```

### Event Handling

```typescript
// Listen for plugin registration
pluginManager.on('plugin:registered', (plugin) => {
  console.log(`Plugin registered: ${plugin.name} (${plugin.version})`);
});

// Listen for plugin errors
pluginManager.on('plugin:error', (error) => {
  console.error(`Plugin error: ${error.plugin} - ${error.error}`);
});
```

### Destroying Plugins

```typescript
// Destroy all plugins when shutting down
await pluginManager.destroy();
```

## Creating Custom Plugins

### Request Preprocessor Plugin

```typescript
import { SHCPlugin, PluginType } from '@shc/core';

export class HeaderInjectionPlugin implements SHCPlugin {
  name = 'header-injection';
  version = '1.0.0';
  type = PluginType.REQUEST_PREPROCESSOR;
  
  private headers: Record<string, string> = {};
  
  async configure(config: Record<string, unknown>): Promise<void> {
    if (config.headers && typeof config.headers === 'object') {
      this.headers = config.headers as Record<string, string>;
    }
  }
  
  async execute(request: any): Promise<any> {
    // Create a new request object to avoid mutating the original
    const modifiedRequest = { ...request };
    
    // Ensure headers object exists
    if (!modifiedRequest.headers) {
      modifiedRequest.headers = {};
    }
    
    // Add custom headers
    for (const [name, value] of Object.entries(this.headers)) {
      modifiedRequest.headers[name] = value;
    }
    
    return modifiedRequest;
  }
}
```

### Response Transformer Plugin

```typescript
import { SHCPlugin, PluginType } from '@shc/core';

export class DataTransformerPlugin implements SHCPlugin {
  name = 'data-transformer';
  version = '1.0.0';
  type = PluginType.RESPONSE_TRANSFORMER;
  
  private transformations: Array<(data: any) => any> = [];
  
  async configure(config: Record<string, unknown>): Promise<void> {
    // Configuration logic
  }
  
  addTransformation(transform: (data: any) => any): void {
    this.transformations.push(transform);
  }
  
  async execute(response: any): Promise<any> {
    // Create a new response object to avoid mutating the original
    const modifiedResponse = { ...response };
    
    // Apply transformations to the response data
    if (modifiedResponse.data) {
      for (const transform of this.transformations) {
        modifiedResponse.data = transform(modifiedResponse.data);
      }
    }
    
    return modifiedResponse;
  }
}
```

### Authentication Provider Plugin

```typescript
import { SHCPlugin, PluginType } from '@shc/core';

export class BasicAuthPlugin implements SHCPlugin {
  name = 'basic-auth';
  version = '1.0.0';
  type = PluginType.AUTH_PROVIDER;
  
  private username: string = '';
  private password: string = '';
  
  async configure(config: Record<string, unknown>): Promise<void> {
    if (typeof config.username === 'string') {
      this.username = config.username;
    }
    if (typeof config.password === 'string') {
      this.password = config.password;
    }
  }
  
  async execute(request: any): Promise<any> {
    // Create a new request object to avoid mutating the original
    const modifiedRequest = { ...request };
    
    // Ensure headers object exists
    if (!modifiedRequest.headers) {
      modifiedRequest.headers = {};
    }
    
    // Add Basic Authentication header
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    modifiedRequest.headers['Authorization'] = `Basic ${credentials}`;
    
    return modifiedRequest;
  }
}
```

## Plugin with Template Functions

```typescript
import { SHCPlugin, PluginType } from '@shc/core';

export class UuidPlugin implements SHCPlugin {
  name = 'uuid';
  version = '1.0.0';
  type = PluginType.REQUEST_PREPROCESSOR;
  
  // Plugin implementation
  async execute(request: any): Promise<any> {
    return request;
  }
  
  // Template functions
  providedFunctions = {
    v4: {
      execute: async () => {
        // Simple UUID v4 implementation for example purposes
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      parameters: []
    }
  };
}
```

## Implementation Notes

1. The Plugin System API is implemented using a modular architecture that allows for dynamic loading of plugins.
2. Plugins are loaded using the `pacote` library for NPM packages, the filesystem for local plugins, and `simple-git` for Git repositories.
3. Plugin lifecycle management ensures proper initialization and cleanup of resources.
4. The API follows the TypeScript best practices specified in the project rules, including proper error handling and type safety.
5. Plugin loading is designed to work in any environment without requiring global installation of tools.
6. The API provides a flexible way to extend the core functionality through plugins.
7. Template functions provided by plugins can be used in configuration and request templates.
