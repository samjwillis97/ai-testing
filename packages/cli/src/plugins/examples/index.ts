/**
 * Example Plugins Loader
 * Automatically loads example plugins for development and testing
 */
import { CLIPlugin, CLIPluginContext } from '../../types/cli-plugin.types.js';
import markdownFormatterPlugin from './markdown-formatter.js';
import helpCommandPlugin from './help-command.js';
import jsonVisualizerPlugin from './json-visualizer.js';
import bashCompletionPlugin from './bash-completion.js';

/**
 * Load all example plugins
 * @param context Plugin context
 */
export function loadExamplePlugins(context: CLIPluginContext): void {
  const plugins: CLIPlugin[] = [
    markdownFormatterPlugin,
    helpCommandPlugin,
    jsonVisualizerPlugin,
    bashCompletionPlugin,
    // Add more example plugins here
  ];
  console.log('Loading example plugins...');

  // Register each plugin (plugins will respect silent mode internally)
  for (const plugin of plugins) {
    try {
      plugin.register(context);
    } catch (error) {
      // Error logging is handled by the plugin manager
    }
  }
}
