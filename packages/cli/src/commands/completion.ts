/**
 * Completion command
 */
import { Command } from 'commander';
import {
  generateCompletionScript,
  getCollectionsForCompletion,
  getRequestsForCompletion,
} from '../utils/completion.js';

/**
 * Add completion command to program
 */
export function addCompletionCommand(program: Command): void {
  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell type (bash, zsh, fish)')
    .action((shell: string) => {
      if (!['bash', 'zsh', 'fish'].includes(shell)) {
        console.error(`Unsupported shell: ${shell}`);
        console.error('Supported shells: bash, zsh, fish');
        process.exit(1);
      }

      try {
        const script = generateCompletionScript(shell as 'bash' | 'zsh' | 'fish');
        console.log(script);
      } catch (error) {
        console.error(
          `Failed to generate completion script: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });

  // Hidden commands for tab completion
  program.command('--get-collections', { hidden: true }).action(async (options) => {
    try {
      const collections = await getCollectionsForCompletion(options);
      console.log(collections.join('\n'));
    } catch (error) {
      process.exit(1);
    }
  });

  program
    .command('--get-requests', { hidden: true })
    .argument('<collection>', 'Collection name')
    .action(async (collection, options) => {
      try {
        const requests = await getRequestsForCompletion(collection, options);
        console.log(requests.join('\n'));
      } catch (error) {
        process.exit(1);
      }
    });
}
