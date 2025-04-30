/**
 * Bash Completion Plugin
 * A sample CLI plugin that provides enhanced completion for bash shell
 */
import { CLIPlugin, CLIPluginType, CLIPluginContext } from '../../types/cli-plugin.types.js';

/**
 * Generate completions for bash shell
 */
function generateBashCompletions(line: string, point: number): string[] {
  // This is a simplified example. In a real plugin, this would be more sophisticated.
  const words = line.split(' ');
  const currentWord = words[words.length - 1];

  // If completing the first word (command), suggest SHC commands
  if (words.length <= 1) {
    const commands = ['get', 'post', 'put', 'delete', 'patch', 'list', 'help-more'];
    return commands.filter((cmd) => cmd.startsWith(currentWord));
  }

  // If completing after 'list', suggest list subcommands
  if (words.length === 2 && words[0] === 'list') {
    const subcommands = ['collections', 'requests'];
    return subcommands.filter((cmd) => cmd.startsWith(currentWord));
  }

  // Default to no completions
  return [];
}

/**
 * Bash Completion Plugin
 */
const bashCompletionPlugin: CLIPlugin = {
  name: 'bash-completion',
  type: CLIPluginType.SHELL_COMPLETION,
  version: '1.0.0',
  description: 'Provides enhanced completion for bash shell',
  register: (context: CLIPluginContext) => {
    // Register the bash completion handler
    context.registerShellCompletion('bash', generateBashCompletions);
  },
};

export default bashCompletionPlugin;
