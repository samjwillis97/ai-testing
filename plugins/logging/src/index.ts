import { mkdir, appendFile } from 'fs/promises';
import path from 'path';
import { PluginType } from './types';
import { LoggingPluginConfig, DEFAULT_CONFIG, LogLevel } from './types';

/**
 * Request/Response Logging Plugin for SHC
 *
 * This plugin provides comprehensive logging capabilities for requests and responses,
 * with configurable detail levels and multiple output targets.
 */
const LoggingPlugin = {
  name: 'logging-plugin',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,

  // Plugin configuration
  config: { ...DEFAULT_CONFIG },

  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);

    // Create log directory if using file output and it doesn't exist
    if (this.config.output.type === 'file' && this.config.output.options.filePath) {
      const logDir = path.dirname(this.config.output.options.filePath);
      console.log('Log directory:', logDir);
      try {
        // Ensure the directory exists
        await mkdir(logDir, { recursive: true });
      } catch (err: unknown) {
        console.error(`Failed to create log directory: ${(err as Error).message}`);
      }
    }
  },

  // Plugin configuration
  async configure(config: Partial<LoggingPluginConfig>): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      output: {
        ...DEFAULT_CONFIG.output,
        ...config.output,
        options: {
          ...DEFAULT_CONFIG.output.options,
          ...config.output?.options,
        },
      },
      format: {
        ...DEFAULT_CONFIG.format,
        ...config.format,
      },
    };

    console.log(`Configured ${this.name} with level: ${this.config.level}`);
  },

  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
  },

  // Plugin execution - processes requests before they are sent
  async execute(request: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Log the request
    await this.logRequest(request);

    // Return the request unmodified
    return request;
  },

  // Provided functions for template resolution
  providedFunctions: {
    // Get current log level
    getLogLevel: {
      execute: async (): Promise<string> => {
        return LoggingPlugin.config.level;
      },
      parameters: [],
    },

    // Set log level
    setLogLevel: {
      execute: async (level: LogLevel): Promise<void> => {
        if (['debug', 'info', 'warn', 'error'].includes(level)) {
          LoggingPlugin.config.level = level as LogLevel;
          await LoggingPlugin.log('info', `Log level set to ${level}`);
        } else {
          throw new Error(`Invalid log level: ${level}`);
        }
      },
      parameters: ['level'],
    },
  },

  // Utility methods

  /**
   * Log a request
   */
  async logRequest(request: Record<string, unknown>): Promise<void> {
    const method = request.method as string;
    const url = request.url as string;
    const headers = request.headers as Record<string, unknown>;
    const data = request.data;

    let message = `REQUEST: ${method} ${url}`;

    // Add headers if configured
    if (this.config.format.includeHeaders && headers) {
      const sanitizedHeaders = this.config.format.maskSensitiveData
        ? this.maskSensitiveData(headers)
        : headers;

      message += `\nHeaders: ${JSON.stringify(sanitizedHeaders, null, 2)}`;
    }

    // Add body if configured
    if (this.config.format.includeBody && data) {
      const sanitizedData = this.config.format.maskSensitiveData
        ? this.maskSensitiveData(data)
        : data;

      message += `\nBody: ${typeof sanitizedData === 'object' ? JSON.stringify(sanitizedData, null, 2) : sanitizedData}`;
    }

    // Output the message using the configured output method
    await this.outputMessage(message);

    // Store the request timestamp for calculating response time
    request._loggingTimestamp = Date.now();
  },

  /**
   * Log a response
   */
  async logResponse(response: Record<string, unknown>): Promise<void> {
    const status = response.status as number;
    const statusText = response.statusText as string;
    const headers = response.headers as Record<string, unknown>;
    const data = response.data;
    const config = response.config as Record<string, unknown>;
    const requestTime = config._loggingTimestamp
      ? Date.now() - (config._loggingTimestamp as number)
      : undefined;

    let message = `RESPONSE: ${status} ${statusText}`;

    // Add response time if available
    if (requestTime !== undefined) {
      message += ` (${requestTime}ms)`;
    }

    // Add headers if configured
    if (this.config.format.includeHeaders && headers) {
      const sanitizedHeaders = this.config.format.maskSensitiveData
        ? this.maskSensitiveData(headers)
        : headers;

      message += `\nHeaders: ${JSON.stringify(sanitizedHeaders, null, 2)}`;
    }

    // Add body if configured
    if (this.config.format.includeBody && data) {
      const sanitizedData = this.config.format.maskSensitiveData
        ? this.maskSensitiveData(data)
        : data;

      message += `\nBody: ${typeof sanitizedData === 'object' ? JSON.stringify(sanitizedData, null, 2) : sanitizedData}`;
    }

    // Output the message using the configured output method
    await this.outputMessage(message);
  },

  /**
   * Log a message with the specified level
   */
  async log(level: LogLevel, message: string): Promise<void> {
    // Check if we should log based on configured level
    if (!this.shouldLog(level)) {
      return;
    }

    // Format the message
    const formattedMessage = this.formatMessage(level, message);

    // Output the message
    await this.outputMessage(formattedMessage);
  },

  /**
   * Check if a message with the given level should be logged
   */
  shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  },

  /**
   * Format a log message
   */
  formatMessage(level: LogLevel, message: string): string {
    let formattedMessage = `[${level.toUpperCase()}] ${message}`;

    // Add timestamp if configured
    if (this.config.format.timestamp) {
      const timestamp = new Date().toISOString();
      formattedMessage = `[${timestamp}] ${formattedMessage}`;
    }

    return formattedMessage;
  },

  /**
   * Output a message to the configured destination
   */
  async outputMessage(message: string): Promise<void> {
    switch (this.config.output.type) {
      case 'console':
        // Output to console
        console.log(message);
        break;

      case 'file':
        // Output to file if file path is configured
        if (this.config.output.options.filePath) {
          try {
            // Create directory if it doesn't exist
            const logDir = path.dirname(this.config.output.options.filePath);
            await mkdir(logDir, { recursive: true });

            // Write to file
            await appendFile(this.config.output.options.filePath, message + '\n');
          } catch (err: unknown) {
            console.error(`Failed to write to log file: ${(err as Error).message}`);
            // Fallback to console
            console.log(message);
          }
        } else {
          console.warn('File output configured but no filePath specified');
          // Fallback to console
          console.log(message);
        }
        break;

      case 'service':
        // Output to service if service URL is configured
        if (this.config.output.options.serviceUrl) {
          try {
            const response = await fetch(this.config.output.options.serviceUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message }),
            });

            if (!response.ok) {
              throw new Error(`Service responded with status ${response.status}`);
            }
          } catch (err: unknown) {
            console.error(`Failed to send log to service: ${(err as Error).message}`);
            // Fallback to console
            console.log(message);
          }
        } else {
          console.warn('Service output configured but no serviceUrl specified');
          // Fallback to console
          console.log(message);
        }
        break;

      default:
        // Unknown output type, fallback to console
        console.warn(`Unknown output type: ${this.config.output.type}, using console`);
        console.log(message);
    }
  },

  /**
   * Mask sensitive data in an object
   */
  maskSensitiveData(data: unknown): unknown {
    // If data is not an object or is null, return as is
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // If data is an array, mask each item
    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    // Clone the object to avoid modifying the original
    const masked = { ...(data as Record<string, unknown>) };

    // List of sensitive field names (case-insensitive)
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'apikey',
      'api_key',
      'access_token',
      'refresh_token',
      'private',
      'sensitive',
    ];

    // Check each property
    for (const [key, value] of Object.entries(masked)) {
      // Check if the key contains any sensitive field name
      const isSensitive = sensitiveFields.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive) {
        // Mask the value
        masked[key] = '********';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively mask nested objects
        masked[key] = this.maskSensitiveData(value);
      }
    }

    return masked;
  },
};

export default LoggingPlugin;
