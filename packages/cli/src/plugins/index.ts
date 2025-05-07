/**
 * CLI Plugin System
 * Initializes and manages CLI plugins
 */
import { createConfigManagerFromOptions } from '../utils/config.js';
import { cliPluginManager } from './plugin-manager.js';
import { SHCConfig } from '@shc/core';
import { Logger } from '../utils/logger.js';

/**
 * Initialize the CLI plugin system
 * @param options CLI options
 */
export async function initializePlugins(options: Record<string, unknown>): Promise<void> {
  const quiet = Boolean(options.quiet);
  // Use the global logger instead of creating a new one
  // This ensures we maintain the quiet mode setting
  const logger = Logger.getInstance();

  try {
    // Set quiet mode in plugin manager
    cliPluginManager.setQuietMode(quiet);

    // Create a config manager from CLI options
    const configManager = await createConfigManagerFromOptions(options);

    // Get the configuration
    const config = configManager.get('') as SHCConfig;

    // Store the config file path for plugin discovery
    const configFilePath = options.config as string;
    if (configFilePath) {
      (config as Record<string, unknown>).configFilePath = configFilePath;
    }

    // Store the output format in the config for use by plugins
    if (options.output && typeof options.output === 'string') {
      if (!config.cli) {
        (config as Record<string, unknown>).cli = {};
      }
      const typedConfig = config as Record<string, unknown>;
      if (typedConfig.cli && typeof typedConfig.cli === 'object') {
        const cliConfig = typedConfig.cli as Record<string, unknown>;
        if (!cliConfig.defaultFormat) {
          cliConfig.defaultFormat = options.output;
        }
      }
    }

    // Load plugins from configuration
    await cliPluginManager.loadPlugins(config);
  } catch (error) {
    // Error handling is suppressed in quiet mode
    if (!quiet) {
      logger.error('Failed to initialize CLI plugins:', error);
    }
  }
}

// Export the plugin manager
export { cliPluginManager } from './plugin-manager.js';
export {
  CLIPluginType,
  CLIPlugin,
  CLIPluginContext,
  OutputFormatter,
  CommandHandler,
  CompletionHandler,
  ResponseVisualizer,
} from '../types/cli-plugin.types.js';
