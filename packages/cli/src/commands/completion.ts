/**
 * Completion command
 */
import { Command } from 'commander';
import {
  generateCompletionScript,
  getCollectionsForCompletion,
  getRequestsForCompletion,
  setProgramForCompletion,
} from '../utils/completion.js';
import { cliPluginManager } from '../plugins/index.js';
import { Logger } from '../utils/logger.js';
import { CommandWithLogger } from '../utils/program.js';

/**
 * Add completion command to program
 */
export function addCompletionCommand(program: Command): void {
  // Set the program instance for introspection
  setProgramForCompletion(program);

  program
    .command('completion')
    .description('Generate shell completion script')
    .argument('<shell>', 'Shell type (bash, zsh, fish)')
    .option('--eval', 'Generate completion script suitable for eval')
    .action(function(this: Command, shell: string, options) {
      // Use the global logger instance from the program if available
      const parentWithLogger = this.parent as CommandWithLogger;
      const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);

      if (!['bash', 'zsh', 'fish'].includes(shell)) {
        logger.error(`Unsupported shell: ${shell}`);
        logger.info('Supported shells: bash, zsh, fish');
        process.exit(1);
      }

      try {
        // Set environment variable for eval mode if needed
        if (options.eval) {
          process.env.SHC_COMPLETION_EVAL_MODE = 'true';

          // In eval mode, we want to output directly to stdout without any logger formatting
          const script = generateCompletionScript(shell as 'bash' | 'zsh' | 'fish');
          // Use process.stdout.write to avoid any additional newlines or formatting
          process.stdout.write(script);
        } else {
          const script = generateCompletionScript(shell as 'bash' | 'zsh' | 'fish');
          logger.info(script);
        }
      } catch (error) {
        if (!options.eval) {
          // Only show error messages when not in eval mode
          logger.error(
            `Failed to generate completion script: ${error instanceof Error ? error.message : String(error)}`
          );
        }
        process.exit(1);
      }
    });

  // Dynamic completion command for plugins
  program
    .command('--complete', { hidden: true })
    .argument('<shell>', 'Shell type')
    .argument('<line>', 'Current command line')
    .argument('<point>', 'Cursor position')
    .action(function(this: Command, shell: string, line: string, pointStr: string) {
      // Use the global logger instance from the program if available
      const parentWithLogger = this.parent as CommandWithLogger;
      const logger = parentWithLogger?.logger || Logger.fromCommandOptions({});

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
  program.command('--get-collections', { hidden: true }).action(async function(this: Command, options) {
    try {
      // Use the global logger instance from the program if available
      const parentWithLogger = this.parent as CommandWithLogger;
      const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);
      const collections = await getCollectionsForCompletion(options);
      process.stdout.write(collections.join('\n'));
    } catch (error) {
      process.exit(1);
    }
  });

  program
    .command('--get-requests', { hidden: true })
    .argument('<collection>', 'Collection name')
    .action(async function(this: Command, collection, options) {
      try {
        // Use the global logger instance from the program if available
        const parentWithLogger = this.parent as CommandWithLogger;
        const logger = parentWithLogger?.logger || Logger.fromCommandOptions(options);
        const requests = await getRequestsForCompletion(collection, options);
        process.stdout.write(requests.join('\n'));
      } catch (error) {
        process.exit(1);
      }
    });
}
