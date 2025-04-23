# SHC Base Plugins

This directory contains a collection of example plugins for Sam's HTTP Client (SHC). These plugins serve as:
1. Reference implementations for the SHC plugin system
2. Building blocks for custom plugin development
3. Examples of best practices in plugin architecture

## Plugin Directory Structure

```
plugins/
├── package.json          # Workspace configuration and shared dependencies
├── tsconfig.json        # Shared TypeScript configuration
├── logging/             # Request/Response Logging Plugin
├── rate-limit/          # Request Rate Limiting Plugin
├── cache/              # Response Cache Plugin
├── retry/              # Request Retry Plugin
├── oauth2/             # OAuth2 Authentication Plugin
├── transform/          # Response Transform Plugin
└── template/           # Request Template Plugin
```

Each plugin directory contains:
- `src/` - Source code
- `tests/` - Test files
- `package.json` - Plugin-specific dependencies and scripts
- `tsconfig.json` - Plugin-specific TypeScript configuration
- `README.md` - Plugin documentation

## Available Plugins

### 1. Request/Response Logging Plugin
- Comprehensive logging capabilities
- Multiple output targets
- Configurable log formats
- Performance metrics

### 2. Request Rate Limiting Plugin
- Per-endpoint rate limiting
- Request queuing
- Distributed rate limiting support
- Statistics and monitoring

### 3. Response Cache Plugin
- Multiple storage backends
- Configurable cache strategies
- Cache invalidation rules
- Cache statistics

### 4. Request Retry Plugin
- Multiple retry strategies
- Configurable backoff algorithms
- Circuit breaker integration
- Failure condition definitions

### 5. OAuth2 Authentication Plugin
- Multiple OAuth2 flows
- Token management
- Automatic token refresh
- Scope handling

### 6. Response Transform Plugin
- JSON/XML transformations
- Data extraction
- Response formatting
- Schema validation

### 7. Request Template Plugin
- Reusable request templates
- Variable substitution
- Template inheritance
- Environment integration

## Using the Plugins

### Installation
```bash
# Install a specific plugin
pnpm add @shc/plugin-logging

# Or install all base plugins
pnpm add @shc/plugin-logging @shc/plugin-rate-limit @shc/plugin-cache @shc/plugin-retry @shc/plugin-oauth2 @shc/plugin-transform @shc/plugin-template
```

### Basic Usage
```typescript
import { SHCClient } from '@shc/core';
import { LoggingPlugin } from '@shc/plugin-logging';

const client = new SHCClient();

// Add the plugin
client.use(new LoggingPlugin({
  level: 'debug',
  output: {
    type: 'console'
  }
}));
```

## Development

### Setup
```bash
# Install dependencies
pnpm install

# Build all plugins
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Creating a New Plugin
1. Create a new directory in `plugins/`
2. Copy the basic structure from an existing plugin
3. Update package.json with your plugin details
4. Implement the plugin interface
5. Add tests and documentation

## Plugin Guidelines

See the [Base Plugins Specification](/specs/base-plugins.md) for detailed information about:
- Plugin interface
- Hook system integration
- Best practices
- Configuration guidelines
- Error handling
- Testing requirements

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT - See [LICENSE](LICENSE) for more information. 