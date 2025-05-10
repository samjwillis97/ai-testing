# SHC Base Plugins

This directory contains specifications for the base plugins provided with the SHC client.

## Plugin Categories

### Core Functionality Plugins
- [**Request/Response Logging**](./logging-plugin.md): Detailed logging of HTTP requests and responses
- [**Request Rate Limiting**](./rate-limiting-plugin.md): Control the rate of outgoing requests
- [**Response Caching**](./cache-plugin.md): Cache responses to reduce duplicate requests
- [**Request Retry**](./retry-plugin.md): Automatically retry failed requests

### Authentication Plugins
- [**OAuth2 Authentication**](./oauth2-plugin.md): Comprehensive OAuth 2.0 authentication support
- [**Authentication Framework**](./auth-plugin.md): Flexible authentication framework supporting multiple schemes

## Plugin Lifecycle

Each plugin follows a standard lifecycle:

1. **Registration**: Plugin is registered with the plugin manager
2. **Initialization**: Plugin's `onInit` method is called
3. **Configuration**: Plugin's `onConfigure` method is called with configuration options
4. **Usage**: Plugin's methods are called during request/response processing
5. **Destruction**: Plugin's `onDestroy` method is called when the plugin is removed

## Best Practices

When developing plugins, follow these best practices:

1. **Configuration**
   - Provide sensible defaults
   - Validate configuration options
   - Document all configuration options

2. **Error Handling**
   - Catch and handle errors appropriately
   - Provide meaningful error messages
   - Don't let errors in your plugin affect other plugins

3. **Performance**
   - Optimize for performance
   - Avoid blocking operations
   - Use asynchronous methods when appropriate

4. **Compatibility**
   - Follow the plugin interface
   - Don't rely on implementation details
   - Test with different versions of SHC

5. **Documentation**
   - Document your plugin's purpose
   - Document configuration options
   - Provide usage examples

## Implementation Requirements

All plugin implementations must follow the TypeScript best practices as defined in the project rules, including:

- Proper typing for all functions and methods
- Appropriate error handling
- Consistent async/await patterns
- Proper use of generics and type constraints
- Comprehensive test coverage (minimum 80% for statements, functions, and lines)
