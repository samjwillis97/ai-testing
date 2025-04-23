# Core Package (@shc/core) Specification

## Overview

The core package (@shc/core) is the foundation of SHC, providing HTTP client functionality, extension system, configuration management, and supporting features for other packages.

## Components

### HTTP Client

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

### Extension System

- Pluggable architecture:
  - Request preprocessors
  - Response transformers
  - Authentication providers
  - Custom visualizers
  - Scripting hooks
- Extension lifecycle management
- Standardized TypeScript interfaces
- Sandboxed execution environment
- Permission model and security controls
- Extension discovery and loading

#### Plugin Loading and Management

- Dynamic plugin loading based on configuration
- Support for multiple plugin sources:
  - NPM packages (installed automatically)
  - Local file paths (installed from local directory)
  - Git repositories (cloned and installed)
- Automatic dependency resolution
- Version management and compatibility checking
- Hot-reloading support for development
- Plugin state management and cleanup

#### Plugin Interface Requirements

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

#### Plugin Types

##### Request Preprocessor

Purpose: Modify or enhance HTTP requests before they are sent to the server, and provide template functions for dynamic request configuration.

```typescript
interface RequestPreprocessorPlugin extends SHCPlugin {
  type: PluginType.REQUEST_PREPROCESSOR;
  execute: (request: HTTPRequest) => Promise<HTTPRequest>;
  providedFunctions?: Record<string, TemplateFunction>;
}

interface HTTPRequest {
  url: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

interface TemplateFunction {
  name: string;
  description: string;
  execute: (...args: any[]) => Promise<any>;
  parameters?: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
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
- Timestamp generation
- UUID generation
- Data encryption
- Parameter encoding

Example Configuration:
```yaml
plugins:
  preprocessors:
    - name: api-key-injector
      package: "@shc/api-key-injector"
      config:
        headerName: "X-API-Key"
        keyLocation: "env.API_KEY"
    
    - name: request-validator
      package: "@shc/request-validator"
      config:
        schemas:
          "/api/users":
            post:
              required: ["username", "email"]
              format:
                email: "email"
                username: "^[a-zA-Z0-9_]{3,16}$"
    
    - name: dynamic-values
      package: "@shc/dynamic-values"
      config:
        functions:
          - name: "timestamp"
            description: "Generate ISO timestamp"
          - name: "uuid"
            description: "Generate UUID v4"
          - name: "encrypt"
            description: "Encrypt data using AES-256"
            parameters:
              - name: "data"
                type: "string"
                required: true
              - name: "key"
                type: "string"
                required: true
```

Example Usage in Request Configuration:
```yaml
requests:
  create_event:
    url: "/api/events"
    method: "POST"
    body:
      id: "${dynamic-values.uuid()}"
      timestamp: "${dynamic-values.timestamp()}"
      data: "${dynamic-values.encrypt(sensitive_data, env.ENCRYPTION_KEY)}"
      
  bulk_upload:
    url: "/api/upload"
    method: "POST"
    headers:
      "X-Request-ID": "${dynamic-values.uuid()}"
      "X-Timestamp": "${dynamic-values.timestamp()}"
    body:
      # Using template function with parameters
      encryptedPayload: "${dynamic-values.encrypt(data.payload, env.ENCRYPTION_KEY)}"
```

Example Plugin Implementation:
```typescript
class DynamicValuesPlugin implements RequestPreprocessorPlugin {
  type = PluginType.REQUEST_PREPROCESSOR;
  
  providedFunctions = {
    timestamp: {
      name: "timestamp",
      description: "Generate ISO timestamp",
      execute: async () => new Date().toISOString()
    },
    
    uuid: {
      name: "uuid",
      description: "Generate UUID v4",
      execute: async () => crypto.randomUUID()
    },
    
    encrypt: {
      name: "encrypt",
      description: "Encrypt data using AES-256",
      parameters: [
        {
          name: "data",
          type: "string",
          description: "Data to encrypt",
          required: true
        },
        {
          name: "key",
          type: "string",
          description: "Encryption key",
          required: true
        }
      ],
      execute: async (data: string, key: string) => {
        // Encryption implementation
        return encryptAES256(data, key);
      }
    }
  };

  async execute(request: HTTPRequest): Promise<HTTPRequest> {
    // Normal request preprocessing logic
    return request;
  }
}
```

Function Resolution Process:
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

##### Response Transformer

Purpose: Transform, validate, or enhance HTTP responses before they are returned to the client.

```typescript
interface ResponseTransformerPlugin extends SHCPlugin {
  type: PluginType.RESPONSE_TRANSFORMER;
  execute: (response: HTTPResponse) => Promise<HTTPResponse>;
}

interface HTTPResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
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

Example Configuration:
```yaml
plugins:
  transformers:
    - name: error-standardizer
      package: "@shc/error-standardizer"
      config:
        errorFormat:
          code: "$.error.code"
          message: "$.error.message"
          details: "$.error.details"
    
    - name: response-cache
      package: "@shc/response-cache"
      config:
        ttl: 3600
        maxSize: "100mb"
        invalidationRules:
          - method: "POST"
            path: "/api/users"
            invalidate: ["/api/users", "/api/users/*"]
```

##### Authentication Provider

Purpose: Handle authentication and authorization for HTTP requests.

```typescript
interface AuthProviderPlugin extends SHCPlugin {
  type: PluginType.AUTH_PROVIDER;
  execute: (context: AuthContext) => Promise<AuthResult>;
  refresh?: (token: string) => Promise<AuthResult>;
  validate?: (token: string) => Promise<boolean>;
}

interface AuthContext {
  credentials?: Record<string, string>;
  scopes?: string[];
  audience?: string;
  request?: HTTPRequest;
}

interface AuthResult {
  type: 'Bearer' | 'Basic' | 'Digest' | 'Custom';
  token: string;
  expires?: Date;
  refreshToken?: string;
  scopes?: string[];
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

Example Configuration:
```yaml
plugins:
  auth:
    - name: oauth2-client
      package: "@shc/oauth2-client"
      config:
        type: "authorization_code"
        clientId: "${ENV.OAUTH_CLIENT_ID}"
        clientSecret: "${ENV.OAUTH_CLIENT_SECRET}"
        authorizeUrl: "https://auth.example.com/authorize"
        tokenUrl: "https://auth.example.com/token"
        scopes: ["read", "write"]
        autoRefresh: true
```

#### Configuration Examples

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
        scopes: ["read", "write"]

  preprocessors:
    - name: request-logger
      package: "@shc/request-logger"
      enabled: true
      config:
        logLevel: "debug"
        outputFormat: "json"
```

2. Local File Plugin:
```yaml
plugins:
  transformers:
    - name: custom-response-transformer
      path: "./plugins/response-transformer"
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

#### Plugin Loading Process

1. Configuration Parse Phase:
   - Parse plugin configuration
   - Validate plugin metadata
   - Check for circular dependencies
   - Resolve plugin load order

2. Installation Phase:
   - For NPM packages:
     ```typescript
     async function installNpmPlugin(plugin: PluginConfig): Promise<void> {
       const { package, version } = plugin;
       await packageManager.install(`${package}@${version}`);
     }
     ```
   - For local paths:
     ```typescript
     async function installLocalPlugin(plugin: PluginConfig): Promise<void> {
       const { path } = plugin;
       await packageManager.install(path);
     }
     ```
   - For Git repositories:
     ```typescript
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

#### Plugin Security

1. Sandboxing:
   - Isolated execution environment
   - Limited file system access
   - Restricted network access
   - Resource usage limits

2. Permissions:
   ```yaml
   plugins:
     auth:
       - name: oauth2-provider
         package: "@shc/oauth2-plugin"
         permissions:
           network:
             - "api.oauth-provider.com"
           filesystem:
             read: ["config/*"]
             write: ["logs/*"]
           env:
             - "OAUTH_*"
   ```

3. Validation:
   - Package signature verification
   - Code integrity checks
   - Dependency vulnerability scanning
   - Runtime behavior monitoring

#### Error Handling

```typescript
interface PluginError extends Error {
  pluginName: string;
  pluginType: PluginType;
  severity: 'warning' | 'error' | 'fatal';
  recoverable: boolean;
}

class PluginLoadError extends Error implements PluginError {
  constructor(plugin: PluginConfig, cause: Error) {
    super(`Failed to load plugin ${plugin.name}: ${cause.message}`);
    this.pluginName = plugin.name;
    this.pluginType = plugin.type;
    this.severity = 'error';
    this.recoverable = false;
  }
}
```

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

### Request/Response Pipeline

- Middleware architecture
- Hook system:
  - Pre-request hooks
  - Post-request hooks
  - Error handling hooks
- Pipeline customization
- Request/response transformation
- Logging and monitoring

## Technical Specifications

- Language: TypeScript
- Base HTTP library: Axios
- Module system: ES Modules
- Package manager: pnpm
- Testing framework: Jest
- Documentation: TypeDoc

## Security Features

- Secure credential storage
- Token management
- Certificate validation
- Extension sandboxing
- Input sanitization
- Audit logging

## Integration Points

- Exports TypeScript types and interfaces
- Event system for cross-package communication
- Plugin API for extensions
- Configuration API
- Authentication providers

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
