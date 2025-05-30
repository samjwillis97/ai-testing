import { PluginType } from './types';
import LoggingPlugin from './index';
import type { LoggingPluginConfig } from './types';

/**
 * Response Transformer Hook for the Logging Plugin
 *
 * This hook logs responses after they are received.
 */
const LoggingResponseHook = {
  name: 'logging-response-hook',
  version: '1.0.0',
  type: PluginType.RESPONSE_TRANSFORMER,

  // Plugin configuration - shared with the main plugin
  config: LoggingPlugin.config,

  // Plugin initialization
  async initialize(): Promise<void> {
    console.log(`Initializing ${this.name} v${this.version}`);
  },

  // Plugin configuration - shared with the main plugin
  async configure(_config: Partial<LoggingPluginConfig>): Promise<void> {
    // Configuration is shared with the main plugin
    this.config = LoggingPlugin.config;
  },

  // Plugin cleanup
  async destroy(): Promise<void> {
    console.log(`Shutting down ${this.name}`);
  },

  // Plugin execution - processes responses after they are received
  async execute(response: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Log the response
    await LoggingPlugin.logResponse(response);

    // Return the response unmodified
    return response;
  },
};

export default LoggingResponseHook;
