# Core Package (@shc/core) Specification

## Overview

The core package (@shc/core) is the foundation of SHC, providing HTTP client functionality, extension system, configuration management, and supporting features for other packages.

## Technical Specifications

- Language: TypeScript
- Base HTTP library: Axios
- Module system: ES Modules
- Package manager: pnpm
- Testing framework: Jest
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
  
  // Variable set management
  addVariableSet(collection: string, variableSet: VariableSet): Promise<void>;
  updateVariableSet(collection: string, name: string, variableSet: VariableSet): Promise<void>;
  getActiveVariableSet(collection: string): Promise<VariableSet>;
  
  // Environment management
  setEnvironment(collection: string, environment: string): Promise<void>;
  getEnvironments(collection: string): Promise<string[]>;
  
  // Request execution
  executeRequest(collection: string, requestId: string, options?: ExecuteOptions): Promise<Response>;
}

interface Collection {
  name: string;
  version: string;
  variableSets: VariableSet[];
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
  global?: Record<string, any>;
  environments: Record<string, Record<string, any>>;
  nested?: Record<string, any>;
}

interface ExecuteOptions {
  environment?: string;
  variableOverrides?: Record<string, any>;
  timeout?: number;
}

// Example Usage:
const collectionManager = new CollectionManager();

// Load a collection
const collection = await collectionManager.loadCollection('./api-collection.yaml');

// Create a new collection
const newCollection = await collectionManager.createCollection('my-api', {
  baseUrl: 'https://api.example.com',
  variableSets: [{
    name: 'default',
    environments: {
      development: {
        apiKey: 'dev-key',
        timeout: 5000
      },
      production: {
        apiKey: 'prod-key',
        timeout: 3000
      }
    }
  }]
});

// Add a request to the collection
await collectionManager.addRequest('my-api', {
  id: 'get-users',
  name: 'Get Users',
  method: 'GET',
  path: '/users',
  headers: {
    'Accept': 'application/json',
    'X-API-Key': '${variables.apiKey}'
  },
  query: {
    limit: '10',
    offset: '0'
  }
});

// Set the environment
await collectionManager.setEnvironment('my-api', 'development');

// Execute a request from the collection
const response = await collectionManager.executeRequest('my-api', 'get-users', {
  variableOverrides: {
    limit: '20'
  }
});

// Working with variable sets
const variableSet: VariableSet = {
  name: 'test-users',
  environments: {
    development: {
      users: [
        { id: 1, name: 'Test User 1' },
        { id: 2, name: 'Test User 2' }
      ]
    }
  }
};

await collectionManager.addVariableSet('my-api', variableSet);

// Get active variable set
const activeVars = await collectionManager.getActiveVariableSet('my-api');
```

### Configuration API

```typescript
interface ConfigManager {
  // Load and parse configuration
  loadFromFile(path: string): Promise<void>;
  loadFromString(content: string): Promise<void>;
  
  // Configuration access
  get<T>(path: string, defaultValue?: T): T;
  set(path: string, value: any): void;
  has(path: string): boolean;
  
  // Environment variables
  getEnv(name: string, defaultValue?: string): string;
  requireEnv(name: string): string;
  
  // Template resolution
  resolve(template: string): Promise<string>;
  resolveObject<T>(obj: T): Promise<T>;
}

// Example Usage:
const config = new ConfigManager();

// Load configuration
await config.loadFromFile('config.yaml');

// Access configuration values
const apiKey = config.get('api.key');
const dbConfig = config.get('database', { host: 'localhost' });

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
