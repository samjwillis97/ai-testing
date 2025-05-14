# SHC Logging Plugin

A comprehensive request/response logging plugin for the SHC HTTP client.

## Features

- Log HTTP requests and responses
- Configurable log levels (debug, info, warn, error)
- Multiple output destinations (console, file, service)
- Sensitive data masking
- Customizable formatting options
- Dual ESM/CommonJS support

## Installation

```bash
pnpm add @shc/logging-plugin
```

## Usage

```typescript
import { Client } from '@shc/core';
import LoggingPlugin from '@shc/logging-plugin';
import LoggingResponseHook from '@shc/logging-plugin/response-hook';

// Create a new client
const client = new Client();

// Register the logging plugin
await client.registerPlugin(LoggingPlugin, {
  level: 'debug',
  output: {
    type: 'file',
    options: {
      filePath: './logs/http.log'
    }
  },
  format: {
    timestamp: true,
    includeHeaders: true,
    includeBody: true,
    maskSensitiveData: true
  }
});

// Register the response hook
await client.registerResponseHook(LoggingResponseHook);

// Make requests - they will be logged automatically
const response = await client.get('https://api.example.com/data');
```

## Configuration

The logging plugin accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | `'debug'` \| `'info'` \| `'warn'` \| `'error'` | `'info'` | Minimum log level |
| `output.type` | `'console'` \| `'file'` \| `'service'` | `'console'` | Log output destination |
| `output.options.filePath` | `string` | `undefined` | Path to log file (for file output) |
| `output.options.serviceUrl` | `string` | `undefined` | URL of logging service (for service output) |
| `format.timestamp` | `boolean` | `true` | Include timestamp in logs |
| `format.includeHeaders` | `boolean` | `true` | Include headers in logs |
| `format.includeBody` | `boolean` | `false` | Include request/response body in logs |
| `format.maskSensitiveData` | `boolean` | `true` | Mask sensitive data in logs |

## Provided Functions

The logging plugin provides the following functions that can be used in templates:

### `getLogLevel`

Returns the current log level.

```typescript
const level = await client.resolveTemplate('${logging.getLogLevel()}');
```

### `setLogLevel`

Sets the log level.

```typescript
await client.resolveTemplate('${logging.setLogLevel("debug")}');
```

## License

MIT
