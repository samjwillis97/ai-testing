# Task: Implement Event-Based Logging System for Core Package

## Overview
Create an event-based logging system in the core package that allows plugins and core components to emit log events that can be consumed by different interfaces (CLI, web UI, etc.) in a way that's appropriate for their specific context. This will replace direct console.log usage throughout the core package and provide a consistent way for plugins to output messages.

## Status
⏳ **IN PROGRESS** - May 12, 2025

## Background
The core package and plugins currently use direct `console.log` calls in many places, which makes it difficult to:
1. Provide consistent logging across different interfaces (CLI, web UI, etc.)
2. Control log levels (debug, info, warn, error) based on the consumer's needs
3. Format log messages consistently across different interfaces
4. Track the source of log messages (which plugin or component generated them)
5. Include structured metadata with log messages
6. Test log-generating code

This was highlighted when implementing the plugin loading feature, which required careful management of console logs to ensure they were appropriate for different contexts.

## Requirements

1. Define Log Event Types:
   - Add log-related events to the existing `SHCEvent` type
   - Define a `LogEvent` interface with level, message, source, timestamp, and metadata
   - Support different log levels (debug, info, warn, error)

2. Create a Log Emitter Interface:
   - Define methods for emitting logs at different levels
   - Support creating scoped loggers for specific components or plugins
   - Include support for structured metadata

3. Implement Log Emitter in SHCClient:
   - Use the existing event emitter to emit log events
   - Provide methods for logging at different levels
   - Support creating scoped loggers for plugins

4. Update Plugin Interface:
   - Add a logEmitter property to the SHCPlugin interface
   - Provide loggers to plugins during registration
   - Update existing plugins to use the logEmitter

5. Replace Console Logs:
   - Replace all direct console.log calls in the core package with event emitter calls
   - Ensure proper log levels are used for different types of messages

6. Update CLI Package:
   - Handle log events from the core package
   - Format log messages appropriately for the CLI context
   - Respect the CLI's log level settings

## Implementation Plan

### 1. Define Log Event Types
```typescript
// src/types/client.types.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type SHCEvent =
  // Existing events
  | 'request'
  | 'response'
  | 'error'
  | 'plugin:registered'
  | 'plugin:removed'
  | 'collection:loaded'
  | 'collection:created'
  | 'collection:updated'
  | 'collection:deleted'
  // New log events
  | 'log'
  | 'log:debug'
  | 'log:info'
  | 'log:warn'
  | 'log:error';

export interface LogEvent {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

### 2. Create a Log Emitter Interface
```typescript
// src/types/log-emitter.types.ts
import { LogLevel, LogEvent } from './client.types';

export interface LogEmitter {
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void;
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
  
  // For plugins to create a scoped logger
  createLogger(source: string): LogEmitter;
}
```

### 3. Implement LogEmitter in SHCClient
```typescript
// src/services/client.ts
import { LogEmitter } from '../types/log-emitter.types';
import { LogLevel, LogEvent } from '../types/client.types';

export class SHCClient implements SHCClient, LogEmitter {
  // Existing properties...
  
  // LogEmitter implementation
  log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const logEvent: LogEvent = {
      level,
      message,
      source: 'client',
      timestamp: Date.now(),
      metadata
    };
    
    // Emit both specific and general log events
    this.eventEmitter.emit(`log:${level}`, logEvent);
    this.eventEmitter.emit('log', logEvent);
  }
  
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, metadata);
  }
  
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log('error', message, metadata);
  }
  
  createLogger(source: string): LogEmitter {
    return new ClientLogger(this.eventEmitter, source);
  }
}
```

### 4. Update Plugin Interface
```typescript
// src/types/plugin.types.ts
import { LogEmitter } from './log-emitter.types';

export interface SHCPlugin {
  // Existing properties...
  
  // For logging
  logEmitter?: LogEmitter;
}
```

### 5. Update CLI Package
```typescript
// packages/cli/src/commands/direct-request.ts
import { SHCClient, LogEvent } from '@shc/core';

// In the command action
const client = await SHCClient.create(config);

// Set up log event handlers
client.on('log', (logEvent: LogEvent) => {
  const { level, message, source } = logEvent;
  
  // Handle logs based on the CLI's logger level
  switch (level) {
    case 'debug':
      logger.debug(`[${source}] ${message}`);
      break;
    case 'info':
      logger.info(`[${source}] ${message}`);
      break;
    case 'warn':
      logger.warn(`[${source}] ${message}`);
      break;
    case 'error':
      logger.error(`[${source}] ${message}`);
      break;
  }
});
```

## Benefits

1. **Consistent Logging**: All components use the same event-based logging mechanism.
2. **Flexible Output**: Different interfaces can handle logs in ways appropriate for their context.
3. **Source Tracking**: Each log includes its source for better debugging.
4. **Metadata Support**: Logs can include structured metadata for more detailed information.
5. **Level-Based Filtering**: Logs can be filtered by level based on the consumer's needs.
6. **No Direct Console Usage**: Components don't use console.log directly, making the code more maintainable.
7. **Testability**: Log events can be captured and verified in tests.

## Future Enhancements

1. **Log Filtering**: Add support for filtering logs by source or other criteria.
2. **Log Formatting**: Allow consumers to specify custom log formatting.
3. **Log Persistence**: Add support for persisting logs to files or other storage.
4. **Log Aggregation**: Support for aggregating logs from multiple sources.
5. **Performance Metrics**: Include performance metrics in log events.

## Related Tasks
- [Implement Centralized Logging System](./implement-centralized-logging-system.md) - The CLI-specific logging system that will consume these events
- [Improve CLI Test Coverage](./improve-cli-test-coverage.md) - Will benefit from the improved testability of log events

## References
- [Event Emitter Documentation](https://nodejs.org/api/events.html)
- [TypeScript Event Emitter Types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/events.d.ts)
