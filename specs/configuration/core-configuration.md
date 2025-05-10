# Core Configuration Specification

## Overview

The core configuration system provides a centralized way to configure the SHC client and its plugins. It supports multiple formats, environment variables, and template resolution.

## Configuration File Format

The SHC client supports the following configuration file formats:

- YAML (default)
- JSON
- TOML

The default configuration file location is `~/.shc/config.yaml`, but this can be overridden using the `--config` flag in the CLI or the `SHC_CONFIG_PATH` environment variable.

## Core Configuration Schema

```typescript
interface CoreConfig {
  // Client configuration
  client: {
    // Base URL for all requests
    baseUrl?: string;
    // Default timeout in milliseconds
    timeout?: number;
    // Default headers to include in all requests
    headers?: Record<string, string>;
    // Default query parameters to include in all requests
    params?: Record<string, string>;
    // Default authentication configuration
    auth?: AuthConfig;
    // Proxy configuration
    proxy?: {
      host: string;
      port: number;
      auth?: {
        username: string;
        password: string;
      };
      protocol?: 'http' | 'https';
    };
    // SSL/TLS configuration
    ssl?: {
      verify: boolean;
      ca?: string;
      cert?: string;
      key?: string;
      passphrase?: string;
    };
    // HTTP version
    httpVersion?: '1.0' | '1.1' | '2.0';
    // Maximum redirects to follow
    maxRedirects?: number;
    // Whether to decompress responses
    decompress?: boolean;
  };
  
  // Plugin configuration
  plugins?: Record<string, any>;
  
  // Environment configuration
  environment?: {
    // Current environment name
    current?: string;
    // Variable sets for different environments
    // Can be defined inline or loaded from external files
    variableSets?: Record<string, VariableSetConfig>;
  };
  
  // Variable set configuration can be inline or reference external files
  interface VariableSetConfig {
    // Inline variable set definition
    [key: string]: any;
    // OR external file reference
    file?: string;
    // OR glob pattern to load multiple files
    glob?: string;
  };
  
  // Template configuration
  templates?: {
    // Custom template functions
    functions?: Record<string, string>;
    // Template variables
    variables?: Record<string, any>;
  };
  
  // Request collections
  collections?: {
    // Collection directories
    directories?: string[];
    // Default collection
    default?: string;
  };
  
  // Logging configuration
  logging?: {
    // Log level
    level?: 'debug' | 'info' | 'warn' | 'error';
    // Log format
    format?: 'text' | 'json';
    // Log file path
    file?: string;
    // Whether to log to console
    console?: boolean;
    // Whether to log request and response bodies
    logBodies?: boolean;
    // Maximum body size to log
    maxBodySize?: number;
  };
}
```

## Example Configuration

### YAML Format (config.yaml)

```yaml
client:
  baseUrl: https://api.example.com
  timeout: 5000
  headers:
    Accept: application/json
    User-Agent: SHC/1.0
  auth:
    type: basic
    credentials:
      username: ${env.API_USERNAME}
      password: ${env.API_PASSWORD}
  proxy:
    host: proxy.example.com
    port: 8080
    auth:
      username: proxyuser
      password: ${env.PROXY_PASSWORD}
  ssl:
    verify: true

plugins:
  logging:
    enabled: true
    logLevel: info
    logFormat: text
    logBodies: true
    maxBodySize: 1024
  
  cache:
    enabled: true
    maxSize: 100
    ttl: 3600
  
  retry:
    enabled: true
    maxRetries: 3
    retryDelay: 1000
    statusCodes: [408, 429, 500, 502, 503, 504]

environment:
  current: development
  variableSets:
    # Inline variable set definition
    development:
      baseUrl: https://dev-api.example.com
      timeout: 10000
    
    # External file reference
    staging:
      file: "./variable-sets/staging.yaml"
    
    # External file with glob pattern
    production:
      glob: "./variable-sets/production/*.yaml"
    
    # Mixed approach with both inline and external references
    testing:
      file: "./variable-sets/testing-base.yaml"
      overrides:
        baseUrl: https://test-api.example.com

templates:
  functions:
    timestamp: "() => Date.now()"
    uuid: "() => crypto.randomUUID()"
  
  variables:
    apiVersion: v1
    defaultFormat: json

collections:
  directories:
    - ~/.shc/collections
    - ./collections
  default: main

logging:
  level: info
  format: text
  file: ~/.shc/logs/shc.log
  console: true
  logBodies: true
  maxBodySize: 4096
```

### JSON Format (config.json)

```json
{
  "client": {
    "baseUrl": "https://api.example.com",
    "timeout": 5000,
    "headers": {
      "Accept": "application/json",
      "User-Agent": "SHC/1.0"
    },
    "auth": {
      "type": "basic",
      "credentials": {
        "username": "${env.API_USERNAME}",
        "password": "${env.API_PASSWORD}"
      }
    }
  },
  "plugins": {
    "logging": {
      "enabled": true,
      "logLevel": "info"
    },
    "cache": {
      "enabled": true,
      "maxSize": 100,
      "ttl": 3600
    }
  },
  "environment": {
    "current": "development",
    "variableSets": {
      "development": {
        "baseUrl": "https://dev-api.example.com"
      },
      "staging": {
        "file": "./variable-sets/staging.json"
      },
      "production": {
        "glob": "./variable-sets/production/*.json"
      },
      "testing": {
        "file": "./variable-sets/testing-base.json",
        "overrides": {
          "baseUrl": "https://test-api.example.com"
        }
      }
    }
  }
}
```

## Configuration Loading

The configuration is loaded in the following order, with later sources overriding earlier ones:

1. Default configuration (hardcoded defaults)
2. Configuration file (`~/.shc/config.yaml` by default)
3. Environment-specific configuration (based on `environment.current`)
4. Environment variables (prefixed with `SHC_`)
5. Command-line arguments (when using the CLI)

## Configuration Access

The configuration can be accessed using the `ConfigManager` interface:

```typescript
// Get a configuration value
const timeout = configManager.get<number>('client.timeout', 5000);

// Set a configuration value
configManager.set('client.headers.X-Custom-Header', 'value');

// Load configuration from a file
await configManager.loadFromFile('/path/to/config.yaml');

// Load configuration from a string
await configManager.loadFromString(yamlString);

// Validate configuration
const validationResult = await configManager.validate();
if (!validationResult.valid) {
  console.error('Configuration validation failed:', validationResult.errors);
}

// Resolve templates
await configManager.resolveTemplates();
```

## Template Resolution

The configuration system supports template resolution using the `${...}` syntax. Templates can reference:

1. Environment variables: `${env.API_KEY}`
2. Other configuration values: `${client.baseUrl}/api`
3. Custom functions: `${timestamp()}`
4. Variables: `${variables.apiVersion}`

For more details on templates, see the [Templates Specification](./templates.md).

## Environment Variables

Environment variables can be used to override configuration values. The naming convention is:

- Convert the configuration path to uppercase
- Replace dots with underscores
- Prefix with `SHC_`

For example:
- `client.timeout` becomes `SHC_CLIENT_TIMEOUT`
- `plugins.logging.enabled` becomes `SHC_PLUGINS_LOGGING_ENABLED`

For more details on environment variables, see the [Environment Variables Specification](./environment-variables.md).

## Variable Sets

Variable sets allow defining different configuration values for different environments. The current environment is determined by the `environment.current` configuration value, which can be overridden using the `SHC_ENVIRONMENT` environment variable.

For more details on variable sets, see the [Variable Sets Specification](./variable-sets.md).

## Implementation Requirements

The core configuration implementation must follow these requirements:

1. **Performance**:
   - Efficient configuration loading and access
   - Minimal overhead for template resolution
   - Lazy loading of configuration files

2. **Flexibility**:
   - Support for multiple configuration formats
   - Extensible template system
   - Pluggable validation

3. **Reliability**:
   - Proper error handling for configuration loading
   - Validation of configuration values
   - Graceful fallback to defaults

4. **Security**:
   - Secure handling of sensitive configuration values
   - Support for encrypted configuration files
   - Protection against template injection

5. **Usability**:
   - Clear error messages for configuration issues
   - Helpful validation feedback
   - Comprehensive documentation

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
