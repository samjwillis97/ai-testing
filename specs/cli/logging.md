# CLI Logging System Specification

## Overview

This document specifies the centralized logging system for the CLI package (@shc/cli). It outlines the logging architecture, components, and integration with the spinner utility.

## Logging Architecture

The CLI package uses a centralized logging system based on Pino with an integrated spinner utility. This system replaces direct console calls with structured logging methods and provides consistent output formatting throughout the application.

```
┌─────────────────────────────────────────────┐
│                CLI Commands                 │
└───────────────────┬─────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│                Logger Class                 │
│                                             │
│  ┌─────────────┐        ┌─────────────┐     │
│  │  Pino Logger│        │Spinner Utility    │
│  └─────────────┘        └─────────────┘     │
└─────────────────────────────────────────────┘
```

## Logger Class

The Logger class provides a unified interface for all logging operations in the CLI package.

```typescript
export class Logger {
  private static instance: Logger;
  private pino: PinoLogger;
  private logLevel: LogLevel;
  
  private constructor(options?: LoggerOptions) {
    this.logLevel = options?.level || 'info';
    this.pino = pino({
      level: this.logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: options?.colorize ?? true,
          translateTime: true,
          ignore: 'pid,hostname',
        },
      },
    });
  }
  
  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }
  
  setLevel(level: LogLevel): void {
    this.logLevel = level;
    this.pino.level = level;
  }
  
  getLevel(): LogLevel {
    return this.logLevel;
  }
  
  debug(message: string, ...args: any[]): void {
    this.pino.debug(message, ...args);
  }
  
  info(message: string, ...args: any[]): void {
    this.pino.info(message, ...args);
  }
  
  warn(message: string, ...args: any[]): void {
    this.pino.warn(message, ...args);
  }
  
  error(message: string, ...args: any[]): void {
    this.pino.error(message, ...args);
  }
  
  success(message: string, ...args: any[]): void {
    // Custom success level implemented as info with special formatting
    this.pino.info({ success: true }, message, ...args);
  }
  
  // Additional methods for specialized logging
  table(data: any[], columns?: string[]): void {
    if (this.shouldLog('info')) {
      // Implementation for table formatting
    }
  }
  
  json(data: any): void {
    if (this.shouldLog('info')) {
      // Implementation for JSON formatting
    }
  }
  
  // Helper method to determine if a message should be logged
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 20,
      info: 30,
      warn: 40,
      error: 50,
      silent: 100,
    };
    
    return levels[level] >= levels[this.logLevel];
  }
  
  // Spinner integration
  createSpinner(text: string): Spinner {
    return new Spinner(text, { enabled: this.shouldShowSpinner() });
  }
  
  private shouldShowSpinner(): boolean {
    // Only show spinners for info level and below
    return this.logLevel !== 'silent' && this.logLevel !== 'error';
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerOptions {
  level?: LogLevel;
  colorize?: boolean;
  destination?: string | NodeJS.WritableStream;
}
```

## Spinner Utility

The Spinner utility integrates with the Logger class to provide consistent progress indication for long-running operations.

```typescript
export class Spinner {
  private spinner: Ora.Ora | null;
  private text: string;
  private enabled: boolean;
  
  constructor(text: string, options?: SpinnerOptions) {
    this.text = text;
    this.enabled = options?.enabled ?? true;
    
    if (this.enabled) {
      this.spinner = ora({
        text,
        color: options?.color || 'cyan',
        spinner: options?.spinner || 'dots',
      });
    } else {
      this.spinner = null;
    }
  }
  
  start(text?: string): this {
    if (text) {
      this.text = text;
    }
    
    if (this.spinner) {
      this.spinner.start(this.text);
    } else {
      // If spinner is disabled, log the message directly
      Logger.getInstance().debug(this.text);
    }
    
    return this;
  }
  
  stop(): this {
    if (this.spinner) {
      this.spinner.stop();
    }
    
    return this;
  }
  
  succeed(text?: string): this {
    if (this.spinner) {
      this.spinner.succeed(text || this.text);
    } else {
      Logger.getInstance().success(text || this.text);
    }
    
    return this;
  }
  
  fail(text?: string): this {
    if (this.spinner) {
      this.spinner.fail(text || this.text);
    } else {
      Logger.getInstance().error(text || this.text);
    }
    
    return this;
  }
  
  warn(text?: string): this {
    if (this.spinner) {
      this.spinner.warn(text || this.text);
    } else {
      Logger.getInstance().warn(text || this.text);
    }
    
    return this;
  }
  
  info(text?: string): this {
    if (this.spinner) {
      this.spinner.info(text || this.text);
    } else {
      Logger.getInstance().info(text || this.text);
    }
    
    return this;
  }
  
  text(text: string): this {
    this.text = text;
    
    if (this.spinner) {
      this.spinner.text = text;
    }
    
    return this;
  }
}

export interface SpinnerOptions {
  enabled?: boolean;
  color?: Ora.Color;
  spinner?: Ora.Spinner;
}
```

## Log Level-Based Decision Making

All logging decisions in the CLI package are made based on the Logger's log level rather than checking verbose/quiet/silent flags throughout the code. This makes the codebase more maintainable and ensures consistent behavior throughout the application.

### Log Level Hierarchy

1. **DEBUG**: Verbose output including all details
2. **INFO**: Standard output for normal operation
3. **WARN**: Warning messages only
4. **ERROR**: Error messages only
5. **SILENT**: No output at all

### Decision Flow

```
┌─────────────────┐
│  Command Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse Options  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Set Log Level   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Command │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           Log Level Check               │
├─────────────┬───────────────┬───────────┤
│             │               │           │
▼             ▼               ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Debug   │ │ Info    │ │ Warn    │ │ Error   │
│ Output  │ │ Output  │ │ Output  │ │ Output  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Usage Examples

### Basic Logging

```typescript
import { Logger } from './logger';

// Get logger instance
const logger = Logger.getInstance({ level: 'info' });

// Log messages at different levels
logger.debug('Debug message'); // Only shown if level is 'debug'
logger.info('Info message');   // Shown if level is 'debug' or 'info'
logger.warn('Warning message'); // Shown if level is 'debug', 'info', or 'warn'
logger.error('Error message'); // Shown if level is 'debug', 'info', 'warn', or 'error'
```

### Using Spinners

```typescript
import { Logger } from './logger';

async function longRunningTask() {
  const logger = Logger.getInstance();
  const spinner = logger.createSpinner('Processing data...');
  
  try {
    spinner.start();
    
    // Perform long-running task
    await processData();
    
    spinner.succeed('Data processed successfully');
  } catch (error) {
    spinner.fail(`Error processing data: ${error.message}`);
    throw error;
  }
}
```

### Command Integration

```typescript
import { Command } from 'commander';
import { Logger } from './logger';

export function createCommand() {
  const command = new Command('example')
    .description('Example command')
    .option('--log-level <level>', 'Set log level', 'info')
    .action(async (options) => {
      // Set log level based on command options
      const logger = Logger.getInstance();
      logger.setLevel(options.logLevel);
      
      // Execute command with appropriate logging
      const spinner = logger.createSpinner('Running example command');
      spinner.start();
      
      try {
        // Command implementation
        spinner.succeed('Command completed successfully');
      } catch (error) {
        spinner.fail(`Command failed: ${error.message}`);
        process.exit(1);
      }
    });
  
  return command;
}
```

## Implementation Requirements

The logging system implementation must follow these requirements:

1. **Singleton Pattern**:
   - Logger should be implemented as a singleton
   - All components should use the same Logger instance
   - Configuration should be centralized

2. **Performance**:
   - Logging should have minimal performance impact
   - Log level checks should be efficient
   - Avoid unnecessary string formatting for disabled log levels

3. **Extensibility**:
   - Support for custom log transports
   - Pluggable formatting options
   - Support for structured logging

4. **Testing**:
   - Mocking support for testing
   - Ability to capture logs during tests
   - Verification of log level behavior

5. **TypeScript Integration**:
   - Proper typing for all logger methods
   - Type safety for log levels and options
   - Strict null checks

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage.
