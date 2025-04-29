# Core Package (@shc/core) Specification

## Overview

The core package (@shc/core) is the foundation of SHC, providing HTTP client functionality, extension system, configuration management, and supporting features for other packages.

## Technical Specifications

- Language: TypeScript
- Base HTTP library: Axios
- Module system: ES Modules with dual CJS support
  - Primary: ES Modules for modern environments
  - Secondary: CommonJS build for legacy support
  - Build tool: Rollup for dual-format compilation
  - Rationale:
    - Maximizes compatibility across Next.js and CLI environments
    - Enables modern ESM features while maintaining backwards compatibility
    - Allows gradual adoption in existing projects
    - Provides better tree-shaking and build optimization
- Package manager: pnpm
- Testing framework: Vitest
- Documentation: TypeDoc

## Public API

### HTTP Client API

```typescript
interface SHCClient {
  // Create a new HTTP client instance with optional configuration
  static create(config?: SHCConfig): SHCClient;
  
  // Send HTTP requests
  request<T>(config: RequestConfig): Promise<Response<T>>;
  get<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<Response<T>>;
  head<T>(url: string, config?: RequestConfig): Promise<Response<T>>;
  options<T>(url: string, config?: RequestConfig): Promise<Response<T>>;

  // Configure defaults for all requests
  setDefaultHeader(name: string, value: string): void;
  setTimeout(timeout: number): void;
  setBaseURL(url: string): void;
  
  // Plugin management
  use(plugin: SHCPlugin): void;
  removePlugin(pluginName: string): void;
  
  // Event handling
  on(event: SHCEvent, handler: EventHandler): void;
  off(event: SHCEvent, handler: EventHandler): void;
}

// Example Usage:
const client = SHCClient.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  plugins: [
    new OAuth2Plugin({
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret'
    })
  ]
});

// Making requests
const response = await client.get('/users', {
  headers: {
    'Accept': 'application/json'
  },
  query: {
    page: 1,
    limit: 10
  }
});

// Using with TypeScript
interface User {
  id: string;
  name: string;
  email: string;
}

const user = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### Collections API

```typescript
interface CollectionManager {
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
  getGlobalVariableSet(name: string): VariableSet; // Synchronous for in-memory operations
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

interface Collection {
  name: string;
  version: string;
  variableSets: VariableSet[];
  variableSetOverrides?: Record<string, string>;  // Maps variable set name to active value override
  requests: Request[];
  baseUrl?: string;
  authentication?: AuthConfig;
}

interface Request {
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

interface VariableSet {
  name: string;
  description?: string;
  defaultValue?: string;
  activeValue: string;
  values: Record<string, Record<string, any>>;
}

interface ExecuteOptions {
  variableOverrides?: Record<string, any>;
  timeout?: number;
}

// Example Usage:
const collectionManager = new CollectionManager();

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

// Set global variable set value
await collectionManager.setGlobalVariableSetValue('api', 'production');

// Override global variable set value for specific collection
await collectionManager.setVariableSetValue('my-api', 'api', 'staging');

// Execute a request - it will use:
// - Collection's user variable set
// - Collection's override of api variable set (staging)
// - Collection's override of auth variable set (admin)
const response = await collectionManager.executeRequest('my-api', 'get-user-profile', {
  variableOverrides: {
    // Override specific variables if needed
    'api.timeout': 10000
  }
});
```

### Configuration API

```typescript
interface ConfigManager {
  // Loading configuration
  loadFromFile(filePath: string): Promise<void>;
  loadFromObject(config: Record<string, any>): void;
  merge(config: Record<string, any>): void;
  
  // Accessing configuration
  get<T>(path: string, defaultValue?: T): T;
  has(path: string): boolean;
  set(path: string, value: any): void;
  
  // Path resolution
  resolvePath(relativePath: string, basePath?: string): string;
  resolveCollectionPath(collectionPath: string): string;
  resolvePluginPath(pluginPath: string): string;
  
  // Template resolution
  resolve(template: string): Promise<string>;
  resolveObject<T>(object: T): Promise<T>;
}

// Example Usage:
const config = new ConfigManager();

// Load configuration from file
await config.loadFromFile('config.yaml');

// Access configuration values
const apiKey = config.get('api.key');
const dbConfig = config.get('database', { host: 'localhost' });

// Resolve paths
const absoluteCollectionPath = config.resolveCollectionPath('./collections');
const absolutePluginPath = config.resolvePluginPath('../plugins/rate-limit');

// Resolve templates
const resolvedUrl = await config.resolve(
  'https://${env.get("API_HOST")}/v1'
);

// Resolve entire configuration object
const requestConfig = await config.resolveObject({
  url: '${env.get("API_URL")}',
  headers: {
    'X-API-Key': '${secrets.get("API_KEY")}',
    'X-Request-ID': '${uuid.v4()}'
  }
});
```

### Path Resolution and Configuration Management Requirements

The core package is responsible for all configuration parsing, path resolution, and collection management functionality. This includes:

1. **Configuration File Handling**:
   - Loading configuration files from various formats (YAML, JSON)
   - Merging configurations from multiple sources
   - Providing a unified configuration interface

2. **Path Resolution**:
   - Resolving relative paths in configuration files to absolute paths
   - Handling path resolution relative to configuration file location
   - Providing consistent path resolution across different operating systems

3. **Collection Management**:
   - Managing collection storage locations
   - Resolving collection paths from configuration
   - Handling collection file operations

4. **Plugin Configuration**:
   - Loading and configuring plugins based on configuration
   - Resolving plugin paths and dependencies

All client applications (CLI, Web UI, etc.) should delegate these responsibilities to the core package and not implement their own configuration parsing or path resolution logic. This ensures consistent behavior across all interfaces and prevents duplication of functionality.

### Plugin System API

```typescript
interface PluginManager {
  // Register plugins
  register(plugin: SHCPlugin): void;
  registerFromConfig(config: PluginConfig): Promise<void>;
  
  // Plugin lifecycle management
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  
  // Plugin utilities
  getPlugin(name: string): SHCPlugin | undefined;
  listPlugins(): SHCPlugin[];
  isPluginEnabled(name: string): boolean;
  
  // Dynamic loading
  loadFromNpm(packageName: string, version?: string): Promise<void>;
  loadFromPath(path: string): Promise<void>;
  loadFromGit(url: string, ref?: string): Promise<void>;
}

// Example Usage:
const pluginManager = new PluginManager();

// Register a plugin
await pluginManager.registerFromConfig({
  name: 'request-logger',
  package: '@shc/request-logger',
  config: {
    logLevel: 'debug',
    outputFormat: 'json'
  }
});

// Load plugin from npm
await pluginManager.loadFromNpm('@shc/oauth2-plugin', '^1.0.0');

// Get plugin instance
const logger = pluginManager.getPlugin('request-logger');
```

### Event System API

```typescript
interface EventEmitter {
  // Event subscription
  on(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  
  // Event emission
  emit(event: string, ...args: any[]): void;
  
  // Utilities
  listenerCount(event: string): number;
  removeAllListeners(event?: string): void;
}

// Example Usage:
const client = SHCClient.create();

// Subscribe to events
client.on('request', (config) => {
  console.log(`Making request to ${config.url}`);
});

client.on('response', (response) => {
  console.log(`Received response with status ${response.status}`);
});

client.on('error', (error) => {
  console.error('Request failed:', error);
});
```

## Core Features

### HTTP Client Features

- Support for standard HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- Request customization:
  - Headers
  - Query parameters
  - Request body (JSON, form-data, raw text)
  - Timeout configuration
  - Proxy support
- Response handling:
  - Status code
  - Headers
  - Body parsing
  - Response time metrics
  - Connection information
- Advanced features:
  - SSL/TLS certificate verification
  - Automatic redirects
  - Retry mechanisms
  - Rate limiting

### Request/Response Pipeline

- Middleware architecture
- Hook system:
  - Pre-request hooks
  - Post-request hooks
  - Error handling hooks
- Pipeline customization
- Request/response transformation
- Logging and monitoring

### Configuration Management

- YAML/JSON configuration parsing
- Environment variable support
- Configuration validation
- Schema enforcement
- Default configurations
- Configuration inheritance

### Template Engine

- Variable interpolation
- Dynamic request templating
- Environment-aware substitution
- Custom template functions
- Expression evaluation

#### Template Syntax

```typescript
// Basic template syntax
${plugin.function()}
${plugin.function(arg1, arg2)}

// Examples
url: "https://api.example.com/${env.get('API_PATH')}"
headers:
  X-Request-ID: "${uuid.generate()}"
  Authorization: "Bearer ${auth.getToken()}"
body:
  timestamp: "${datetime.now()}"
  data: "${crypto.encrypt(payload, env.KEY)}"
```

#### Template Resolution Process

1. Template parsing phase:
   ```typescript
   interface TemplateFunctionCall {
     plugin: string;
     function: string;
     arguments: any[];
   }

   function parseTemplate(template: string): TemplateFunctionCall[] {
     // Parse ${plugin.function(args)} syntax
     // Return array of function calls
   }
   ```

2. Function execution phase:
   ```typescript
   async function executeTemplateFunction(
     call: TemplateFunctionCall,
     context: ExecutionContext
   ): Promise<any> {
     const plugin = getPlugin(call.plugin);
     const func = plugin.providedFunctions[call.function];
     
     // Validate arguments against parameters
     validateArguments(func.parameters, call.arguments);
     
     // Execute function
     return await func.execute(...call.arguments);
   }
   ```

3. Template substitution phase:
   ```typescript
   async function substituteTemplates(
     config: RequestConfig,
     context: ExecutionContext
   ): Promise<RequestConfig> {
     // Find all template expressions
     const templates = parseTemplate(config);
     
     // Execute each function
     const results = await Promise.all(
       templates.map(t => executeTemplateFunction(t, context))
     );
     
     // Replace template expressions with results
     return replaceTemplates(config, templates, results);
   }
   ```

## Plugin System

### Plugin Interface Requirements

```typescript
interface SHCPlugin {
  // Required metadata
  name: string;
  version: string;
  type: PluginType;
  
  // Lifecycle hooks
  initialize?: () => Promise<void>;
  destroy?: () => Promise<void>;
  
  // Plugin-specific implementations based on type
  execute: (...args: any[]) => Promise<any>;
}

enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider'
}
```

### Plugin Types

#### Request Preprocessor

Purpose: Modify or enhance HTTP requests before they are sent to the server.

```typescript
interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (request: HTTPRequest) => Promise<HTTPRequest>;
  providedFunctions?: Record<string, TemplateFunction>;
}
```

Common Use Cases:
- Adding authentication headers
- Request body transformation
- URL rewriting
- Query parameter manipulation
- Adding tracking headers
- Request validation
- Rate limiting
- Dynamic value generation

#### Response Transformer

Purpose: Transform, validate, or enhance HTTP responses before they are returned to the client.

```typescript
interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (response: HTTPResponse) => Promise<HTTPResponse>;
}
```

Common Use Cases:
- Response data transformation
- Error handling standardization
- Response validation
- Data enrichment
- Caching
- Metrics collection
- Response compression

#### Authentication Provider

Purpose: Handle authentication and authorization for HTTP requests.

```typescript
interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (context: AuthContext) => Promise<AuthResult>;
  refresh?: (token: string) => Promise<AuthResult>;
  validate?: (token: string) => Promise<boolean>;
}
```

Common Use Cases:
- OAuth 2.0 authentication
- API key management
- JWT handling
- Session management
- SSO integration
- Multi-factor authentication
- Token refresh and validation

### Plugin Configuration

```yaml
plugins:
  auth:
    - name: oauth2-provider
      package: "@shc/oauth2-plugin"
      version: "^1.0.0"
      config:
        clientId: "${ENV.OAUTH_CLIENT_ID}"
        clientSecret: "${ENV.OAUTH_CLIENT_SECRET}"
        scopes: ["read", "write"]

  preprocessors:
    - name: request-logger
      package: "@shc/request-logger"
      enabled: true
      config:
        logLevel: "debug"
        outputFormat: "json"
```

### Plugin Loading Requirements

- Plugin loading (from npm, local path, or git) MUST work on any supported machine without requiring users to manually install `git` or `pnpm` globally.
  - The core package MUST bundle or automatically manage any required binaries or dependencies for plugin loading (e.g., use programmatic APIs, package manager libraries, or bundled binaries).
  - Plugin loading MUST be seamless in all environments (local, CI, container, etc.) and MUST NOT fail due to missing global tools.
  - If a tool is required (such as `git` or `pnpm`), the system MUST:
    - Use a Node.js library or embedded binary if available
    - OR provide a clear error message and fallback guidance if truly unavoidable

### Plugin Security

- Sandboxed execution environment
- Permission model and security controls
- Package signature verification
- Code integrity checks
- Dependency vulnerability scanning
- Runtime behavior monitoring

### Plugin Loading

#### Source Types

1. NPM Package Plugin:
```yaml
plugins:
  auth:
    - name: oauth2-provider
      package: "@shc/oauth2-plugin"
      version: "^1.0.0"
      config:
        clientId: "${ENV.OAUTH_CLIENT_ID}"
        clientSecret: "${ENV.OAUTH_CLIENT_SECRET}"
```

2. Local File Plugin:
```yaml
plugins:
  transformers:
    - name: custom-transformer
      path: "./plugins/custom-transformer"
      config:
        transformRules:
          - field: "data.timestamp"
            type: "date"
            format: "ISO"
```

3. Git Repository Plugin:
```yaml
plugins:
  visualizers:
    - name: graph-visualizer
    git: "https://github.com/org/shc-graph-plugin.git"
    ref: "v1.2.0"
    config:
      theme: "dark"
      autoRefresh: true
```

#### Loading Process

1. Configuration Parse Phase:
   - Parse plugin configuration
   - Validate plugin metadata
   - Check for circular dependencies
   - Resolve plugin load order

2. Installation Phase:
   ```typescript
   // NPM package installation
   async function installNpmPlugin(plugin: PluginConfig): Promise<void> {
     const { package, version } = plugin;
     await packageManager.install(`${package}@${version}`);
   }

   // Local path installation
   async function installLocalPlugin(plugin: PluginConfig): Promise<void> {
     const { path } = plugin;
     await packageManager.install(path);
   }

   // Git repository installation
   async function installGitPlugin(plugin: PluginConfig): Promise<void> {
     const { git, ref } = plugin;
     await git.clone(git, ref);
     await packageManager.install('./tmp/plugin-dir');
   }
   ```

3. Initialization Phase:
   ```typescript
   async function initializePlugin(plugin: SHCPlugin): Promise<void> {
     // Validate plugin interface
     validatePluginInterface(plugin);
     
     // Initialize plugin
     if (plugin.initialize) {
       await plugin.initialize();
     }
     
     // Register plugin handlers
     registerPluginHandlers(plugin);
   }
   ```

4. Runtime Phase:
   - Plugin execution based on type
   - Error handling and recovery
   - Performance monitoring
   - Resource management

#### Plugin Dependencies

```yaml
plugins:
  auth:
    - name: oauth2-provider
      package: "@shc/oauth2-plugin"
      dependencies:
        - name: cache
          package: "@shc/cache-plugin"
        - name: crypto
          package: "@shc/crypto-plugin"
```

#### Plugin Permissions

```yaml
plugins:
  transformers:
    - name: data-processor
      permissions:
        filesystem:
          read: ["config/*", "data/*"]
          write: ["cache/*", "logs/*"]
        network:
          - "api.example.com"
        env:
          - "API_*"
          - "APP_*"
```

## Security Features

- Secure credential storage
- Token management
- Certificate validation
- Extension sandboxing
- Input sanitization
- Audit logging

## Error Handling

- Detailed error reporting
- Custom error types
- Error recovery mechanisms
- Debugging support
- Error event propagation

## Package Dependencies

- Minimal external dependencies
- Peer dependency management
- Version compatibility checking
- Security vulnerability scanning
