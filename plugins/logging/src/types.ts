/**
 * Logging level for the plugin
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Output type for logging
 */
export type OutputType = 'console' | 'file' | 'service';

/**
 * Configuration for the logging plugin
 */
export interface LoggingPluginConfig {
  /**
   * Logging level
   * @default 'info'
   */
  level: LogLevel;

  /**
   * Output configuration
   */
  output: {
    /**
     * Output type
     * @default 'console'
     */
    type: OutputType;

    /**
     * Output options
     */
    options: {
      /**
       * File path for file output
       */
      filePath?: string;

      /**
       * Service URL for service output
       */
      serviceUrl?: string;
    };
  };

  /**
   * Format configuration
   */
  format: {
    /**
     * Include timestamp in logs
     * @default true
     */
    timestamp: boolean;

    /**
     * Include headers in logs
     * @default true
     */
    includeHeaders: boolean;

    /**
     * Include body in logs
     * @default false
     */
    includeBody: boolean;

    /**
     * Mask sensitive data in logs
     * @default true
     */
    maskSensitiveData: boolean;
  };
}

/**
 * Default configuration for the logging plugin
 */
export const DEFAULT_CONFIG: LoggingPluginConfig = {
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

/**
 * Plugin type enum
 */
export enum PluginType {
  REQUEST_PREPROCESSOR = 'request-preprocessor',
  RESPONSE_TRANSFORMER = 'response-transformer',
  AUTH_PROVIDER = 'auth-provider',
}
