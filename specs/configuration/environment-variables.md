# Environment Variables Specification

## Overview

The SHC client supports environment variable integration to override configuration values and provide sensitive information without storing it in configuration files. This specification details how environment variables are mapped to configuration values and how they can be used in templates.

## Environment Variable Naming Convention

Environment variables for SHC follow a specific naming convention:

1. Convert the configuration path to uppercase
2. Replace dots with underscores
3. Prefix with `SHC_`

For example:
- `client.timeout` becomes `SHC_CLIENT_TIMEOUT`
- `plugins.logging.enabled` becomes `SHC_PLUGINS_LOGGING_ENABLED`
- `environment.current` becomes `SHC_ENVIRONMENT_CURRENT`

## Special Environment Variables

Some environment variables have special meaning in SHC:

| Environment Variable | Description | Default Value |
|---------------------|-------------|---------------|
| `SHC_CONFIG_PATH` | Path to the configuration file | `~/.shc/config.yaml` |
| `SHC_ENVIRONMENT` | Current environment (shorthand for `SHC_ENVIRONMENT_CURRENT`) | `development` |
| `SHC_LOG_LEVEL` | Log level (shorthand for `SHC_LOGGING_LEVEL`) | `info` |
| `SHC_BASE_URL` | Base URL for requests (shorthand for `SHC_CLIENT_BASEURL`) | - |
| `SHC_COLLECTIONS_DIR` | Directory for request collections (shorthand for `SHC_COLLECTIONS_DIRECTORIES`) | `~/.shc/collections` |

## Type Conversion

Environment variables are strings by default, but SHC converts them to the appropriate type based on the configuration schema:

| Configuration Type | Environment Variable Conversion |
|-------------------|--------------------------------|
| `string` | Used as-is |
| `number` | Parsed using `Number()` |
| `boolean` | `"true"`, `"1"`, `"yes"` → `true`<br>`"false"`, `"0"`, `"no"` → `false` |
| `array` | Split by commas and trimmed |
| `object` | Parsed as JSON if valid, otherwise used as-is |

## Array and Object Environment Variables

For complex types like arrays and objects, SHC supports multiple formats:

### Arrays

Arrays can be specified using comma-separated values:

```
SHC_PLUGINS_RETRY_STATUSCODES=408,429,500,502,503,504
```

Or using JSON format:

```
SHC_PLUGINS_RETRY_STATUSCODES=[408,429,500,502,503,504]
```

### Objects

Objects must be specified using JSON format:

```
SHC_CLIENT_HEADERS={"Accept":"application/json","User-Agent":"SHC/1.0"}
```

## Nested Configuration

For deeply nested configuration, you can use the dot notation in the environment variable name:

```
SHC_PLUGINS_LOGGING_OPTIONS_MAXBODYSIZE=1024
```

This will set the value of `plugins.logging.options.maxBodySize` to `1024`.

## Environment Variable Precedence

Environment variables have a higher precedence than configuration files but a lower precedence than command-line arguments. The full precedence order is:

1. Default configuration (hardcoded defaults)
2. Configuration file (`~/.shc/config.yaml` by default)
3. Environment-specific configuration (based on `environment.current`)
4. Environment variables (prefixed with `SHC_`)
5. Command-line arguments (when using the CLI)

## Using Environment Variables in Templates

Environment variables can be referenced in templates using the `env` namespace:

```
${env.API_KEY}
```

This will be replaced with the value of the `API_KEY` environment variable. If the environment variable is not set, the template will be replaced with an empty string.

You can also provide a default value:

```
${env.API_KEY|default('default-key')}
```

This will use `default-key` if the `API_KEY` environment variable is not set.

## Environment Variable Security

Environment variables are often used for sensitive information like API keys and passwords. SHC takes several measures to protect this information:

1. Environment variables containing sensitive information are not logged
2. When displaying configuration, sensitive values are masked
3. Environment variables are not stored in configuration files

The following environment variable names are considered to contain sensitive information:

- `*_KEY`
- `*_SECRET`
- `*_PASSWORD`
- `*_TOKEN`
- `*_CREDENTIAL`

## Example Usage

### Basic Configuration Override

```bash
# Set the base URL
export SHC_CLIENT_BASEURL=https://api.example.com

# Set the timeout to 10 seconds
export SHC_CLIENT_TIMEOUT=10000

# Enable the cache plugin
export SHC_PLUGINS_CACHE_ENABLED=true

# Set the current environment
export SHC_ENVIRONMENT=production
```

### Authentication Configuration

```bash
# Set basic authentication credentials
export SHC_CLIENT_AUTH_TYPE=basic
export SHC_CLIENT_AUTH_CREDENTIALS_USERNAME=apiuser
export SHC_CLIENT_AUTH_CREDENTIALS_PASSWORD=secretpassword

# Or set bearer token authentication
export SHC_CLIENT_AUTH_TYPE=bearer
export SHC_CLIENT_AUTH_CREDENTIALS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Plugin Configuration

```bash
# Configure the logging plugin
export SHC_PLUGINS_LOGGING_ENABLED=true
export SHC_PLUGINS_LOGGING_LOGLEVEL=debug
export SHC_PLUGINS_LOGGING_LOGBODIES=true

# Configure the retry plugin
export SHC_PLUGINS_RETRY_ENABLED=true
export SHC_PLUGINS_RETRY_MAXRETRIES=5
export SHC_PLUGINS_RETRY_RETRYDELAY=1000
export SHC_PLUGINS_RETRY_STATUSCODES=408,429,500,502,503,504
```

## Implementation Requirements

The environment variable integration implementation must follow these requirements:

1. **Performance**:
   - Efficient environment variable lookup
   - Caching of environment variable values
   - Minimal overhead for type conversion

2. **Flexibility**:
   - Support for various type conversions
   - Extensible naming conventions
   - Configurable environment variable prefixes

3. **Reliability**:
   - Proper error handling for invalid values
   - Graceful fallback to defaults
   - Comprehensive validation

4. **Security**:
   - Secure handling of sensitive environment variables
   - Masking of sensitive values in logs
   - Protection against environment variable leakage

5. **Usability**:
   - Clear error messages for invalid values
   - Helpful debug information
   - Comprehensive documentation

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage with a minimum of 80% for statements, functions, and lines.
