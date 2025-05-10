# Request/Response Logging Plugin

## Overview

The Request/Response Logging Plugin demonstrates pipeline hooks by providing comprehensive logging capabilities for HTTP requests and responses. This plugin serves as an example of how to intercept and process requests and responses in the SHC plugin system.

## Features

- Request and response logging with configurable detail levels
- Multiple output targets (console, file, external services)
- Customizable log formats
- Request/response correlation
- Performance metrics logging

## Configuration

```typescript
interface LoggingPluginConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  output: {
    type: 'console' | 'file' | 'service';
    options: {
      filePath?: string;
      serviceUrl?: string;
    };
  };
  format: {
    timestamp: boolean;
    includeHeaders: boolean;
    includeBody: boolean;
    maskSensitiveData: boolean;
  };
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string | `'info'` | Log level (debug, info, warn, error) |
| `output.type` | string | `'console'` | Output target (console, file, service) |
| `output.options.filePath` | string | `'./logs/shc.log'` | Path to log file (when output.type is 'file') |
| `output.options.serviceUrl` | string | | URL of logging service (when output.type is 'service') |
| `format.timestamp` | boolean | `true` | Include timestamp in log entries |
| `format.includeHeaders` | boolean | `true` | Include headers in log entries |
| `format.includeBody` | boolean | `false` | Include request/response body in log entries |
| `format.maskSensitiveData` | boolean | `true` | Mask sensitive data (auth tokens, passwords) in logs |

## Implementation

### Plugin Class

```typescript
import { 
  Plugin, 
  PluginConfig, 
  RequestConfig, 
  Response, 
  PluginContext 
} from '@shc/core';

export class LoggingPlugin implements Plugin {
  private config: LoggingPluginConfig;
  private logger: Logger;
  
  constructor() {
    // Default configuration
    this.config = {
      level: 'info',
      output: {
        type: 'console',
        options: {},
      },
      format: {
        timestamp: true,
        includeHeaders: true,
        includeBody: false,
        maskSensitiveData: true,
      },
    };
  }
  
  /**
   * Initialize the plugin
   */
  async onInit(context: PluginContext): Promise<void> {
    // Initialize logger based on configuration
    this.logger = this.createLogger();
    this.logger.info('Logging plugin initialized');
  }
  
  /**
   * Configure the plugin
   */
  async onConfigure(config: PluginConfig): Promise<void> {
    // Merge configuration
    this.config = {
      ...this.config,
      ...config,
    };
    
    // Recreate logger with new configuration
    this.logger = this.createLogger();
    this.logger.info('Logging plugin configured', { config: this.config });
  }
  
  /**
   * Process request before it is sent
   */
  async onRequest(request: RequestConfig): Promise<RequestConfig> {
    const startTime = Date.now();
    
    // Add request start time to request object for later use
    request.meta = request.meta || {};
    request.meta.loggingStartTime = startTime;
    
    // Log request
    this.logRequest(request);
    
    return request;
  }
  
  /**
   * Process response after it is received
   */
  async onResponse(response: Response<any>, request: RequestConfig): Promise<Response<any>> {
    // Calculate request duration
    const startTime = request.meta?.loggingStartTime || Date.now();
    const duration = Date.now() - startTime;
    
    // Log response
    this.logResponse(response, request, duration);
    
    return response;
  }
  
  /**
   * Handle request error
   */
  async onError(error: Error, request: RequestConfig): Promise<Error> {
    // Calculate request duration
    const startTime = request.meta?.loggingStartTime || Date.now();
    const duration = Date.now() - startTime;
    
    // Log error
    this.logError(error, request, duration);
    
    return error;
  }
  
  /**
   * Clean up when plugin is destroyed
   */
  async onDestroy(): Promise<void> {
    this.logger.info('Logging plugin destroyed');
    
    // Close logger if needed
    if (typeof this.logger.close === 'function') {
      await this.logger.close();
    }
  }
  
  /**
   * Create logger based on configuration
   */
  private createLogger(): Logger {
    switch (this.config.output.type) {
      case 'file':
        return new FileLogger(this.config);
      case 'service':
        return new ServiceLogger(this.config);
      case 'console':
      default:
        return new ConsoleLogger(this.config);
    }
  }
  
  /**
   * Log request
   */
  private logRequest(request: RequestConfig): void {
    if (!this.shouldLog('info')) {
      return;
    }
    
    const logData: any = {
      type: 'request',
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
    };
    
    if (this.config.format.includeHeaders && request.headers) {
      logData.headers = this.config.format.maskSensitiveData
        ? this.maskSensitiveHeaders(request.headers)
        : request.headers;
    }
    
    if (this.config.format.includeBody && request.data) {
      logData.body = this.config.format.maskSensitiveData
        ? this.maskSensitiveData(request.data)
        : request.data;
    }
    
    this.logger.info(`Request: ${request.method} ${request.url}`, logData);
  }
  
  /**
   * Log response
   */
  private logResponse(response: Response<any>, request: RequestConfig, duration: number): void {
    if (!this.shouldLog(this.getLogLevelForStatus(response.status))) {
      return;
    }
    
    const logData: any = {
      type: 'response',
      method: request.method,
      url: request.url,
      status: response.status,
      statusText: response.statusText,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    if (this.config.format.includeHeaders && response.headers) {
      logData.headers = response.headers;
    }
    
    if (this.config.format.includeBody && response.data) {
      logData.body = response.data;
    }
    
    const logLevel = this.getLogLevelForStatus(response.status);
    this.logger[logLevel](`Response: ${response.status} ${response.statusText} (${duration}ms)`, logData);
  }
  
  /**
   * Log error
   */
  private logError(error: Error, request: RequestConfig, duration: number): void {
    if (!this.shouldLog('error')) {
      return;
    }
    
    const logData: any = {
      type: 'error',
      method: request.method,
      url: request.url,
      error: error.message,
      stack: error.stack,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    if (this.config.format.includeHeaders && request.headers) {
      logData.headers = this.config.format.maskSensitiveData
        ? this.maskSensitiveHeaders(request.headers)
        : request.headers;
    }
    
    this.logger.error(`Error: ${error.message} (${duration}ms)`, logData);
  }
  
  /**
   * Determine if a message should be logged based on level
   */
  private shouldLog(level: string): boolean {
    const levels: Record<string, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    
    return levels[level] >= levels[this.config.level];
  }
  
  /**
   * Get log level based on response status
   */
  private getLogLevelForStatus(status: number): string {
    if (status >= 500) {
      return 'error';
    } else if (status >= 400) {
      return 'warn';
    } else {
      return 'info';
    }
  }
  
  /**
   * Mask sensitive headers
   */
  private maskSensitiveHeaders(headers: Record<string, string>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
    const maskedHeaders = { ...headers };
    
    for (const header of sensitiveHeaders) {
      if (maskedHeaders[header]) {
        maskedHeaders[header] = this.maskValue(maskedHeaders[header]);
      }
    }
    
    return maskedHeaders;
  }
  
  /**
   * Mask sensitive data in request body
   */
  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'api_key'];
    const maskedData = { ...data };
    
    for (const field of sensitiveFields) {
      if (maskedData[field]) {
        maskedData[field] = this.maskValue(maskedData[field]);
      }
    }
    
    return maskedData;
  }
  
  /**
   * Mask a value
   */
  private maskValue(value: string): string {
    if (typeof value !== 'string') {
      return '***';
    }
    
    if (value.length <= 4) {
      return '***';
    }
    
    return value.substring(0, 2) + '***' + value.substring(value.length - 2);
  }
}

/**
 * Logger interface
 */
interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  close?(): Promise<void>;
}

/**
 * Console logger implementation
 */
class ConsoleLogger implements Logger {
  constructor(private config: LoggingPluginConfig) {}
  
  debug(message: string, data?: any): void {
    console.debug(message, data);
  }
  
  info(message: string, data?: any): void {
    console.info(message, data);
  }
  
  warn(message: string, data?: any): void {
    console.warn(message, data);
  }
  
  error(message: string, data?: any): void {
    console.error(message, data);
  }
}

/**
 * File logger implementation
 */
class FileLogger implements Logger {
  private stream: any;
  
  constructor(private config: LoggingPluginConfig) {
    // Initialize file stream
    const fs = require('fs');
    const path = require('path');
    
    const filePath = this.config.output.options.filePath || './logs/shc.log';
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
  }
  
  debug(message: string, data?: any): void {
    this.writeLog('DEBUG', message, data);
  }
  
  info(message: string, data?: any): void {
    this.writeLog('INFO', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.writeLog('WARN', message, data);
  }
  
  error(message: string, data?: any): void {
    this.writeLog('ERROR', message, data);
  }
  
  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end(() => resolve());
    });
  }
  
  private writeLog(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };
    
    this.stream.write(JSON.stringify(logEntry) + '\n');
  }
}

/**
 * Service logger implementation
 */
class ServiceLogger implements Logger {
  constructor(private config: LoggingPluginConfig) {}
  
  debug(message: string, data?: any): void {
    this.sendLog('DEBUG', message, data);
  }
  
  info(message: string, data?: any): void {
    this.sendLog('INFO', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.sendLog('WARN', message, data);
  }
  
  error(message: string, data?: any): void {
    this.sendLog('ERROR', message, data);
  }
  
  private async sendLog(level: string, message: string, data?: any): Promise<void> {
    if (!this.config.output.options.serviceUrl) {
      console.error('Service URL not configured for logging service');
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };
    
    try {
      const response = await fetch(this.config.output.options.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
      
      if (!response.ok) {
        console.error(`Failed to send log to service: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error sending log to service: ${error.message}`);
    }
  }
}
```

## Usage Example

```typescript
import { createSHCClient } from '@shc/core';
import { LoggingPlugin } from '@shc/plugins/logging';

// Create client with logging plugin
const client = createSHCClient({
  plugins: [
    {
      plugin: new LoggingPlugin(),
      config: {
        level: 'debug',
        output: {
          type: 'file',
          options: {
            filePath: './logs/api-requests.log',
          },
        },
        format: {
          timestamp: true,
          includeHeaders: true,
          includeBody: true,
          maskSensitiveData: true,
        },
      },
    },
  ],
});

// Make a request - it will be logged
client.get('https://api.example.com/users')
  .then(response => {
    console.log('Request completed');
  })
  .catch(error => {
    console.error('Request failed', error);
  });
```

## Integration with Other Plugins

The Logging Plugin can be used in combination with other plugins. When multiple plugins are used, the order of plugin registration determines the order of execution:

```typescript
import { createSHCClient } from '@shc/core';
import { LoggingPlugin } from '@shc/plugins/logging';
import { RetryPlugin } from '@shc/plugins/retry';

// Create client with multiple plugins
const client = createSHCClient({
  plugins: [
    {
      plugin: new LoggingPlugin(),
      config: {
        // Logging plugin configuration
      },
    },
    {
      plugin: new RetryPlugin(),
      config: {
        // Retry plugin configuration
      },
    },
  ],
});
```

In this example, the Logging Plugin will be executed before the Retry Plugin for requests, and after the Retry Plugin for responses. This means:

1. Request flow: LoggingPlugin.onRequest -> RetryPlugin.onRequest -> HTTP Request
2. Response flow: HTTP Response -> RetryPlugin.onResponse -> LoggingPlugin.onResponse

## Implementation Requirements

The Logging Plugin implementation must follow these requirements:

1. **Performance**:
   - Minimal impact on request/response performance
   - Asynchronous logging when possible
   - Efficient log formatting and storage

2. **Security**:
   - Proper masking of sensitive data
   - Secure handling of authentication information
   - Safe log storage and transmission

3. **Configurability**:
   - All aspects of logging should be configurable
   - Sensible defaults for all options
   - Runtime configuration changes

4. **Compatibility**:
   - Work with all HTTP methods and content types
   - Support for binary data
   - Proper encoding of log entries

5. **Error Handling**:
   - Graceful handling of logging errors
   - Fallback mechanisms for failed logging
   - No impact on request/response flow when logging fails

The implementation should align with the TypeScript best practices specified in the project rules, ensuring proper typing, error handling, and test coverage.
