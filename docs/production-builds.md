# Production Builds

This document outlines how to create production builds of the SHC CLI and the differences between development and production environments.

## Development vs. Production Mode

The SHC CLI can run in two different modes:

1. **Development Mode** (default): Includes example plugins and additional debug information
2. **Production Mode**: Disables example plugins and minimizes non-essential output

## Disabling Example Plugins

Example plugins are automatically disabled in production builds. This is controlled by the `NODE_ENV` environment variable:

- When `NODE_ENV=production`, example plugins are not loaded
- When `NODE_ENV` is not set or set to anything other than 'production', example plugins are loaded

## Creating Production Builds

To create a production build of the CLI:

```bash
# Build the CLI package for production
pnpm --filter @shc/cli build:prod

# Run the CLI in production mode
pnpm --filter @shc/cli start:prod
```

Alternatively, you can set the environment variable manually:

```bash
# Linux/macOS
NODE_ENV=production node dist/index.js

# Windows (Command Prompt)
set NODE_ENV=production && node dist/index.js

# Windows (PowerShell)
$env:NODE_ENV="production"; node dist/index.js
```

## Example Plugins

The following example plugins are disabled in production mode:

- **Markdown Formatter**: Formats output as Markdown
- **Help Command**: Provides extended help information
- **JSON Visualizer**: Visualizes JSON responses
- **Bash Completion**: Provides bash completion scripts

These plugins are useful for development and testing but are not intended for production use.

## Verifying Production Mode

To verify that the CLI is running in production mode, check the log output:

```bash
# Enable debug logging
DEBUG=true NODE_ENV=production node dist/index.js

# Look for the message: "Example plugins disabled in production mode"
```

## Custom Plugins in Production

Custom plugins configured in the `shc.config.yaml` file will still be loaded in production mode. Only the built-in example plugins are disabled.
