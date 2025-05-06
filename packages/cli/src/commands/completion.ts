/**
 * Completion command
 */
import { Command } from 'commander';
import {
  generateCompletionScript,
  getCollectionsForCompletion,
  getRequestsForCompletion,
} from '../utils/completion.js';
import { cliPluginManager } from '../plugins/index.js';
import { Logger } from '../utils/logger.js';

/**
 * Add completion command to program
 */
export function addCompletionCommand(program: Command): void {
  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell type (bash, zsh, fish)')
    .option('--eval', 'Generate completion script suitable for eval')
    .action((shell: string, options) => {
      const logger = Logger.fromCommandOptions(options);

      if (!['bash', 'zsh', 'fish'].includes(shell)) {
        logger.error(`Unsupported shell: ${shell}`);
        logger.info('Supported shells: bash, zsh, fish');
        process.exit(1);
      }

      try {
        // Set environment variable for eval mode if needed
        if (options.eval) {
          process.env.SHC_COMPLETION_EVAL_MODE = 'true';
        }

        const script = generateCompletionScript(shell as 'bash' | 'zsh' | 'fish');
        logger.info(script);
      } catch (error) {
        logger.error(
          `Failed to generate completion script: ${error instanceof Error ? error.message : String(error)}`
        );
        process.exit(1);
      }
    });

  // Dynamic completion command for plugins
  program
    .command('--complete', { hidden: true })
    .argument('<shell>', 'Shell type')
    .argument('<line>', 'Current command line')
    .argument('<point>', 'Cursor position')
    .action((shell: string, line: string, pointStr: string) => {
      const logger = Logger.fromCommandOptions({});

      try {
        const point = parseInt(pointStr, 10);
        const completionHandler = cliPluginManager.getShellCompletion(shell);

        if (completionHandler) {
          const completions = completionHandler(line, point);
          logger.info(completions.join('\n'));
        } else {
          // Fall back to basic completions
          if (
            line.includes('list') &&
            !line.includes('collections') &&
            !line.includes('requests')
          ) {
            logger.info('collections\nrequests');
          }
        }
      } catch (error) {
        // Silently fail for completion errors
        process.exit(1);
      }
    });

  // Hidden commands for tab completion
  program.command('--get-collections', { hidden: true }).action(async (options) => {
    const logger = Logger.fromCommandOptions(options);

    try {
      const collections = await getCollectionsForCompletion(options);
      logger.info(collections.join('\n'));
    } catch (error) {
      process.exit(1);
    }
  });

  program
    .command('--get-requests', { hidden: true })
    .argument('<collection>', 'Collection name')
    .action(async (collection, options) => {
      const logger = Logger.fromCommandOptions(options);

      try {
        const requests = await getRequestsForCompletion(collection, options);
        logger.info(requests.join('\n'));
      } catch (error) {
        process.exit(1);
      }
    });
}
