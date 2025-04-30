/**
 * JSON Visualizer Plugin
 * A sample CLI plugin that provides enhanced visualization for JSON responses
 */
import { CLIPlugin, CLIPluginType, CLIPluginContext } from '../../types/cli-plugin.types.js';
import chalk from 'chalk';

/**
 * Visualize JSON data with syntax highlighting
 */
function visualizeJson(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }

  try {
    // Convert the data to a JSON string with indentation
    const jsonString = JSON.stringify(data, null, 2);

    // Apply syntax highlighting
    return jsonString
      .replace(/"([^"]+)":/g, (_, key) => `"${chalk.green(key)}":`) // Keys in green
      .replace(/"([^"]+)"/g, (_, value) => `"${chalk.yellow(value)}"`) // String values in yellow
      .replace(/\b(true|false)\b/g, (_, value) => chalk.blue(value)) // Booleans in blue
      .replace(/\b(\d+)\b/g, (_, value) => chalk.cyan(value)) // Numbers in cyan
      .replace(/\bnull\b/g, chalk.red('null')); // null in red
  } catch (error) {
    return String(data);
  }
}

/**
 * JSON Visualizer Plugin
 */
const jsonVisualizerPlugin: CLIPlugin = {
  name: 'json-visualizer',
  type: CLIPluginType.RESPONSE_VISUALIZER,
  version: '1.0.0',
  description: 'Provides enhanced visualization for JSON responses',
  register: (context: CLIPluginContext) => {
    // Register the JSON visualizer
    context.registerResponseVisualizer('json', visualizeJson);
  },
};

export default jsonVisualizerPlugin;
