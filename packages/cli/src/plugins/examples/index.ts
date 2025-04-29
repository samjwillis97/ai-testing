/**
 * Example Plugins Loader
 * Automatically loads example plugins for development and testing
 */
import { CLIPlugin, CLIPluginContext } from '../plugin-manager.js';
import markdownFormatterPlugin from './markdown-formatter.js';

/**
 * Load all example plugins
 * @param context Plugin context
 */
export function loadExamplePlugins(context: CLIPluginContext): void {
  const plugins: CLIPlugin[] = [
    markdownFormatterPlugin,
    // Add more example plugins here
  ];

  // Register each plugin
  for (const plugin of plugins) {
    try {
      plugin.register(context);
      console.log(`Loaded example plugin: ${plugin.name}`);
    } catch (error) {
      console.error(`Failed to load example plugin ${plugin.name}:`, error);
    }
  }
}
