/**
 * Help Command Plugin
 * A sample CLI plugin that adds a custom 'help-more' command
 */
import { CLIPlugin, CLIPluginType, CLIPluginContext } from '../../types/cli-plugin.types.js';

/**
 * Execute the help-more command
 */
async function executeHelpMoreCommand(
  args: string[],
  options: Record<string, unknown>
): Promise<void> {
  console.log('SHC CLI - Extended Help');
  console.log('======================');
  console.log('');
  console.log('This is an extended help command provided by a custom command plugin.');
  console.log('');
  console.log('Common Usage Examples:');
  console.log('  shc get https://api.example.com/users');
  console.log('  shc -c ./config.yaml my-collection my-request');
  console.log('  shc list collections');
  console.log(
    '  shc -V "storage.collections.path=./collections" get https://api.example.com/users'
  );
  console.log('');
  console.log('For more information, visit: https://github.com/example/shc-cli');
}

/**
 * Help Command Plugin
 */
const helpCommandPlugin: CLIPlugin = {
  name: 'help-command',
  type: CLIPluginType.CUSTOM_COMMAND,
  version: '1.0.0',
  description: 'Adds a custom help-more command',
  register: (context: CLIPluginContext) => {
    // Register the help-more command
    context.registerCommand('help-more', executeHelpMoreCommand);
  },
};

export default helpCommandPlugin;
