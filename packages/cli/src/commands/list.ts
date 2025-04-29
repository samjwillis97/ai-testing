/**
 * List command for SHC CLI
 * Allows listing collections and other items
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { getCollections, getRequests } from '../utils/collections.js';
import { createConfigManagerFromOptions } from '../utils/config.js';

/**
 * Add list command to program
 */
export function addListCommand(program: Command): void {
  const listCommand = program.command('list').description('List SHC resources');

  // List collections subcommand
  listCommand
    .command('collections')
    .alias('c')
    .description('List all collections')
    .option('-c, --config <PATH>', 'Config file path')
    .option('--collection-dir <dir>', 'Collection directory')
    .action(async (options: Record<string, unknown>) => {
      try {
        // Create config manager from options
        const configManager = await createConfigManagerFromOptions(options);

        // Get collection directory from config manager
        const collectionDir = configManager.get(
          'storage.collections.path',
          (options.collectionDir as string) || configManager.get('storage.collections.path')
        );

        // Display collections
        await listCollections(collectionDir);
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
        );
        process.exit(1);
      }
    });

  // List requests subcommand
  listCommand
    .command('requests <collection>')
    .alias('r')
    .description('List all requests in a collection')
    .option('-c, --config <PATH>', 'Config file path')
    .option('--collection-dir <dir>', 'Collection directory')
    .action(async (collection: string, options: Record<string, unknown>) => {
      try {
        // Create config manager from options
        const configManager = await createConfigManagerFromOptions(options);

        // Get collection directory from config manager
        const collectionDir = configManager.get(
          'storage.collections.path',
          (options.collectionDir as string) || configManager.get('storage.collections.path')
        );

        // Display requests
        await listRequests(collectionDir, collection);
      } catch (error) {
        console.error(
          chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`)
        );
        process.exit(1);
      }
    });
}

/**
 * List collections
 */
async function listCollections(collectionDir: string): Promise<void> {
  console.log(chalk.gray(`Loading collections from ${collectionDir}...`));

  try {
    const collections = await getCollections(collectionDir);
    console.log(chalk.green('Collections loaded successfully'));

    if (collections.length === 0) {
      console.log(chalk.yellow('No collections found.'));
      console.log(chalk.gray(`Collection directory: ${collectionDir}`));
      return;
    }

    console.log(chalk.bold('\nAvailable collections:'));
    collections.forEach((collection, index) => {
      console.log(`${chalk.cyan(`${index + 1}.`)} ${collection}`);
    });
    console.log(); // Empty line for spacing
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to load collections: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    throw error;
  }
}

/**
 * List requests in a collection
 */
async function listRequests(collectionDir: string, collectionName: string): Promise<void> {
  console.log(chalk.gray(`Loading requests for collection '${collectionName}'...`));

  try {
    const requests = await getRequests(collectionDir, collectionName);
    console.log(chalk.green(`Requests for collection '${collectionName}' loaded successfully`));

    if (requests.length === 0) {
      console.log(chalk.yellow(`No requests found in collection '${collectionName}'.`));
      return;
    }

    console.log(chalk.bold(`\nRequests in collection '${collectionName}':`));

    // Calculate column widths for better formatting
    const idWidth = Math.max(...requests.map((r) => r.id?.length || 0), 2) + 2;
    const nameWidth = Math.max(...requests.map((r) => r.name?.length || 0), 4) + 2;

    // Print top of table
    console.log(
      chalk.dim('┌─') +
        chalk.dim('─'.repeat(3)) +
        chalk.dim('─┬─') +
        chalk.dim('─'.repeat(idWidth)) +
        chalk.dim('─┬─') +
        chalk.dim('─'.repeat(nameWidth)) +
        chalk.dim('─┬─') +
        chalk.dim('─'.repeat(8)) +
        chalk.dim('─┐')
    );

    // Print header
    console.log(
      chalk.dim('│ ') +
        chalk.cyan(chalk.bold('#'.padEnd(3))) +
        chalk.dim(' │ ') +
        chalk.cyan(chalk.bold('ID'.padEnd(idWidth))) +
        chalk.dim(' │ ') +
        chalk.cyan(chalk.bold('NAME'.padEnd(nameWidth))) +
        chalk.dim(' │ ') +
        chalk.cyan(chalk.bold('METHOD'.padEnd(8))) +
        chalk.dim(' │')
    );

    // Print separator
    console.log(
      chalk.dim('├─') +
        chalk.dim('─'.repeat(3)) +
        chalk.dim('─┼─') +
        chalk.dim('─'.repeat(idWidth)) +
        chalk.dim('─┼─') +
        chalk.dim('─'.repeat(nameWidth)) +
        chalk.dim('─┼─') +
        chalk.dim('─'.repeat(8)) +
        chalk.dim('─┤')
    );

    // Print requests
    requests.forEach((request, index) => {
      const method = request.method || '';
      const methodColor =
        method === 'GET'
          ? chalk.green
          : method === 'POST'
            ? chalk.yellow
            : method === 'PUT'
              ? chalk.blue
              : method === 'DELETE'
                ? chalk.red
                : method === 'PATCH'
                  ? chalk.magenta
                  : chalk.white;

      console.log(
        chalk.dim('│ ') +
          chalk.cyan(`${index + 1}`.padEnd(3)) +
          chalk.dim(' │ ') +
          chalk.white(request.id.padEnd(idWidth)) +
          chalk.dim(' │ ') +
          chalk.white(request.name.padEnd(nameWidth)) +
          chalk.dim(' │ ') +
          methodColor(method.padEnd(8)) +
          chalk.dim(' │')
      );
    });

    // Print bottom border
    console.log(
      chalk.dim('└─') +
        chalk.dim('─'.repeat(3)) +
        chalk.dim('─┴─') +
        chalk.dim('─'.repeat(idWidth)) +
        chalk.dim('─┴─') +
        chalk.dim('─'.repeat(nameWidth)) +
        chalk.dim('─┴─') +
        chalk.dim('─'.repeat(8)) +
        chalk.dim('─┘')
    );

    console.log(); // Empty line for spacing
  } catch (error) {
    console.error(
      chalk.red(
        `Failed to load requests: ${error instanceof Error ? error.message : String(error)}`
      )
    );
    throw error;
  }
}
