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
  try {
    // Create a config manager from CLI options
    const configManager = await createConfigManagerFromOptions(options);
    
    // Get the configuration
    const config = configManager.get('') as SHCConfig;
    
    // Load plugins from configuration
    await cliPluginManager.loadPlugins(config);
    
    console.log('CLI plugins initialized');
  } catch (error) {
    console.error('Failed to initialize CLI plugins:', error);
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
  ResponseVisualizer
} from './plugin-manager.js';
