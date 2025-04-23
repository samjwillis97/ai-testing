# SHC Configuration Specification

## Overview

The SHC configuration system defines the global settings, variable sets, plugins, and security policies for the entire application. This specification details the structure and format of the main configuration file.

## Configuration File Format

SHC uses YAML as its primary configuration format, with optional JSON support. The configuration file can be named `shc.config.yaml` or `shc.config.json`.

### Root Structure

```yaml
# SHC Configuration File (shc.config.yaml)
version: "1.0.0"                # SHC configuration version
name: "My API Workspace"        # Name of this configuration
description: "Development APIs" # Optional description

# Core settings for the SHC client
core:
  # HTTP client configuration
  http:
    timeout: 30000             # Default request timeout in ms
    max_redirects: 5           # Maximum number of redirects to follow
    retry:
      attempts: 3              # Number of retry attempts
      backoff: "exponential"   # Retry backoff strategy
    proxy:
      http: "http://proxy:8080"
      https: "https://proxy:8443"
      no_proxy: ["localhost", ".internal.domain"]
    tls:
      verify: true
      ca_certs: ["./certs/ca.pem"]
      client_cert: "./certs/client.pem"
      client_key: "./certs/client.key"
  
  # Logging configuration
  logging:
    level: "info"             # debug, info, warn, error
    format: "json"            # json, text
    output: "console"         # console, file
    file:
      path: "./logs/shc.log"
      max_size: "100MB"
      max_files: 5

# Variable sets configuration
variable_sets:
  # Global variable sets
  global:
    api:
      description: "API configuration for different environments"
      default_value: "development"
      active_value: "development"
      values:
        development:
          url: "http://localhost:3000"
          timeout: 5000
          debug: true
        production:
          url: "https://api.example.com"
          timeout: 3000
          debug: false
    
    auth:
      description: "Authentication configuration"
      default_value: "default"
      active_value: "default"
      values:
        default:
          token_endpoint: "/oauth/token"
          client_id: "${env.CLIENT_ID}"
          client_secret: "${env.CLIENT_SECRET}"
          scopes: ["read", "write"]
  
  # Default collection variable sets
  collection_defaults:
    user:
      description: "Default user configurations"
      default_value: "default"
      active_value: "default"
      values:
        default:
          role: "user"
          permissions: ["read"]

# Plugin configuration
plugins:
  # Authentication plugins
  auth:
    - name: "oauth2"
      package: "@shc/oauth2-plugin"
      version: "^1.0.0"
      enabled: true
      config:
        providers:
          github:
            type: "oauth2"
            client_id: "${env.GITHUB_CLIENT_ID}"
            client_secret: "${env.GITHUB_CLIENT_SECRET}"
  
  # Request preprocessor plugins
  preprocessors:
    - name: "request-logger"
      package: "@shc/request-logger"
      enabled: true
      config:
        format: "detailed"
        include_headers: true
        mask_sensitive: true
    
    - name: "metrics"
      package: "@shc/metrics-plugin"
      enabled: true
      config:
        prometheus:
          port: 9090
          path: "/metrics"

  # Response transformer plugins
  transformers:
    - name: "json-schema-validator"
      package: "@shc/json-schema-validator"
      enabled: true
      config:
        schemas_dir: "./schemas"
        validate_responses: true

# Storage configuration
storage:
  # Collection storage
  collections:
    type: "file"              # file, s3, git
    path: "./collections"     # for file storage
    # s3:                     # for S3 storage
    #   bucket: "shc-collections"
    #   prefix: "prod/"
    #   region: "us-west-2"

## Configuration Sections

### Core Settings

The `core` section configures fundamental SHC behavior:

1. HTTP Client Configuration
   - Default timeouts and retries
   - Proxy settings
   - TLS/SSL configuration
   - Connection pooling

2. Logging Configuration
   - Log levels and formats
   - Output destinations
   - File rotation policies

### Variable Sets

The `variable_sets` section defines global and default collection variables:

1. Global Variable Sets
   - Shared across all collections
   - Environment-specific configurations
   - Authentication settings

2. Collection Defaults
   - Default variable sets for new collections
   - Template configurations
   - Common settings

### Plugin Configuration

The `plugins` section manages all plugin-related settings:

1. Authentication Plugins
   - OAuth2 providers
   - API key management
   - Custom auth methods

2. Request Preprocessors
   - Request modification
   - Logging and metrics
   - Validation

3. Response Transformers
   - Response validation
   - Data transformation
   - Schema enforcement

### Storage Configuration

The `storage` section defines where and how collections are stored:

1. Collection Storage
   - File system
   - S3 buckets
   - Git repositories

## Configuration Resolution

1. Load Order:
   1. Default configuration
   2. Environment-specific configuration
   3. Local configuration
   4. Command-line overrides

2. Variable Resolution:
   - Environment variables
   - Secret references
   - Dynamic values
   - Template expressions

3. Validation:
   - Schema validation
   - Type checking
   - Required fields
   - Format verification

## Best Practices

1. Organization
   - Logical grouping of settings
   - Clear naming conventions
   - Comprehensive documentation
   - Version control

2. Maintenance
   - Regular updates
   - Deprecation handling
   - Backup procedures
   - Migration plans 