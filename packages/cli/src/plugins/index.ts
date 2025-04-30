/**
 * CLI Plugin System
 * Initializes and manages CLI plugins
 */
import { createConfigManagerFromOptions } from '../utils/config.js';
import { cliPluginManager } from './plugin-manager.js';
import { SHCConfig } from '@shc/core';

/**
 * Initialize the CLI plugin system
 * @param options CLI options
 */
export async function initializePlugins(options: Record<string, unknown>): Promise<void> {
  const silent = Boolean(options.silent);

  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  try {
    // If silent mode is enabled, override all console methods
    if (silent) {
      console.log = () => {};
      console.error = () => {};
      console.warn = () => {};
      console.info = () => {};
    }

    // Set silent mode in plugin manager
    cliPluginManager.setSilentMode(silent);

    // Create a config manager from CLI options
    const configManager = await createConfigManagerFromOptions(options);

    // Get the configuration
    const config = configManager.get('') as SHCConfig;

    // Load plugins from configuration
    await cliPluginManager.loadPlugins(config);
  } catch (error) {
    // Error handling is suppressed in silent mode
    if (!silent) {
      console.error('Failed to initialize CLI plugins:', error);
    }
  } finally {
    // Always restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
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
} from './plugin-manager.js';
