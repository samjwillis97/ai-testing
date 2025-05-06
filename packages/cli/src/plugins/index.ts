/**
 * CLI Plugin System
 * Initializes and manages CLI plugins
 */
import { createConfigManagerFromOptions } from '../utils/config.js';
import { cliPluginManager } from './plugin-manager.js';
import { SHCConfig } from '@shc/core';
import { Logger, globalLogger } from '../utils/logger.js';

/**
 * Initialize the CLI plugin system
 * @param options CLI options
 */
export async function initializePlugins(options: Record<string, unknown>): Promise<void> {
  const silent = Boolean(options.silent);
  const logger = Logger.fromCommandOptions(options);

  try {
    // Set silent mode in plugin manager
    cliPluginManager.setSilentMode(silent);

    // Create a config manager from CLI options
    const configManager = await createConfigManagerFromOptions(options);

    // Get the configuration
    const config = configManager.get('') as SHCConfig;

    // Store the config file path for plugin discovery
    const configFilePath = options.config as string;
    if (configFilePath) {
      (config as any).configFilePath = configFilePath;
    }

    // Store the output format in the config for use by plugins
    if (options.output && typeof options.output === 'string') {
      if (!config.cli) {
        (config as any).cli = {};
      }
      if (!(config as any).cli.defaultFormat) {
        (config as any).cli.defaultFormat = options.output;
      }
    }

    // Load plugins from configuration
    await cliPluginManager.loadPlugins(config);
  } catch (error) {
    // Error handling is suppressed in silent mode
    if (!silent) {
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
