# Variable Sets Specification

## Overview

Variable Sets provide a mechanism to define environment-specific configuration values within the SHC client. This allows users to easily switch between different environments (development, staging, production) without modifying the core configuration.

## Variable Sets Structure

Variable sets are defined in the `environment.variableSets` section of the configuration:

```typescript
interface EnvironmentConfig {
  // Current environment name
  current: string;
  
  // Variable sets for different environments
  variableSets: Record<string, Record<string, any>>;
}
```

Each variable set is a named collection of configuration values that override the base configuration when that environment is active.

## Environment Selection

The current environment is determined by the `environment.current` configuration value, which can be overridden using:

1. The `SHC_ENVIRONMENT` environment variable
2. The `--environment` command-line flag (when using the CLI)
3. Programmatically via the API

## Variable Resolution

When a configuration value is requested, the system follows this resolution order (from highest to lowest priority):

1. Check if the value exists in per-request variable set overrides (specified with `--var-set` option)
2. Check if the value exists in collection-level variable set overrides (defined in collection files)
3. Check if the value exists in the current environment's variable set (defined in the main configuration file)
4. If not found, check the base configuration
5. If still not found, return the default value (if provided)

This precedence hierarchy ensures that more specific overrides take priority over more general configurations.

This allows for partial overrides, where only the values that differ between environments need to be specified in the variable sets.

## Example Configuration

```yaml
# Base configuration
client:
  baseUrl: https://api.example.com
  timeout: 5000
  headers:
    Accept: application/json
    User-Agent: SHC/1.0

# Environment configuration
environment:
  current: development
  variableSets:
    development:
      client:
        baseUrl: https://dev-api.example.com
        timeout: 10000
    
    staging:
      client:
        baseUrl: https://staging-api.example.com
      plugins:
        logging:
          logLevel: debug
    
    production:
      client:
        timeout: 3000
      plugins:
        cache:
          enabled: true
          ttl: 3600
```

In this example:

- In the `development` environment, requests will use `https://dev-api.example.com` with a 10-second timeout
- In the `staging` environment, requests will use `https://staging-api.example.com` with the default 5-second timeout, and logging will be set to debug level
- In the `production` environment, requests will use the default `https://api.example.com` with a 3-second timeout, and caching will be enabled with a 1-hour TTL

## Environment Files

In addition to inline variable sets, SHC supports loading environment-specific configuration from separate files:

```
~/.shc/
  ├── config.yaml           # Main configuration file
  └── environments/
      ├── development.yaml  # Development environment
      ├── staging.yaml      # Staging environment
      └── production.yaml   # Production environment
```

These files follow the same structure as the main configuration file but only need to include the values that differ from the base configuration.

The environment files are loaded based on the `environment.current` value. For example, if `environment.current` is set to `development`, the system will load `~/.shc/environments/development.yaml`.

## Environment Variables in Variable Sets

Variable sets can include template references to environment variables:

```yaml
environment:
  current: development
  variableSets:
    development:
      client:
        auth:
          credentials:
            username: ${env.DEV_API_USERNAME}
            password: ${env.DEV_API_PASSWORD}
    
    production:
      client:
        auth:
          credentials:
            username: ${env.PROD_API_USERNAME}
            password: ${env.PROD_API_PASSWORD}
```

This allows for sensitive information to be stored in environment variables rather than configuration files.

## Dynamic Environment Selection

SHC supports dynamically switching environments at runtime:

```typescript
// Switch to the production environment
await client.setEnvironment('production');

// Get the current environment
const currentEnv = client.getEnvironment();

// Check if an environment exists
const hasStaging = client.hasEnvironment('staging');

// Get all available environments
const environments = client.getAvailableEnvironments();
```

## Environment Inheritance

Variable sets support inheritance, where one environment can extend another:

```yaml
environment:
  current: development
  variableSets:
    base:
      client:
        headers:
          Accept: application/json
          User-Agent: SHC/1.0
    
    development:
      extends: base
      client:
        baseUrl: https://dev-api.example.com
    
    staging:
      extends: base
      client:
        baseUrl: https://staging-api.example.com
    
    production:
      extends: base
      client:
        baseUrl: https://api.example.com
```

In this example, all environments inherit the headers from the `base` environment.

## Environment-Specific Plugins

Variable sets can also specify environment-specific plugin configurations:

```yaml
environment:
  current: development
  variableSets:
    development:
      plugins:
        logging:
          enabled: true
          logLevel: debug
          logBodies: true
        
        mockServer:
          enabled: true
          port: 3000
    
    production:
      plugins:
        logging:
          enabled: true
          logLevel: info
          logBodies: false
        
        cache:
          enabled: true
          ttl: 3600
        
        retry:
          enabled: true
          maxRetries: 3
```

This allows for different plugin configurations in different environments, such as enabling mocking in development but caching in production.

## CLI Integration

The SHC CLI provides commands for managing environments:

```bash
# List all available environments
shc env list

# Show the current environment
shc env current

# Switch to a different environment
shc env use production

# Create a new environment
shc env create staging

# Delete an environment
shc env delete staging

# Copy an environment
shc env copy development staging
```

## UI Integration

The SHC UI interfaces (Web UI and Neovim UI) provide visual tools for managing environments:

1. Environment selector dropdown
2. Environment editor for modifying variable sets
3. Environment comparison view
4. Environment creation and deletion

## Implementation Requirements

The variable sets implementation must follow these requirements:

1. **Performance**:
   - Efficient variable resolution
   - Minimal overhead for environment switching
   - Lazy loading of environment files

2. **Flexibility**:
   - Support for nested variable overrides
   - Environment inheritance
   - Dynamic environment creation and modification

3. **Reliability**:
   - Proper error handling for missing environments
   - Validation of environment configurations
   - Graceful fallback to defaults

4. **Security**:
   - Secure handling of sensitive environment values
   - Protection against environment leakage
   - Proper access control for environment switching

5. **Usability**:
   - Clear indication of the current environment
   - Helpful error messages for configuration issues
   - Comprehensive documentation

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
