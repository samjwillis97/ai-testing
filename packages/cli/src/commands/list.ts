/**
 * List command for SHC CLI
 * Allows listing collections and other items
 */
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getCollections, getRequests } from '../utils/collections.js';
import { getEffectiveOptions, getCollectionDir } from '../utils/config.js';

/**
 * Add list command to program
 */
export function addListCommand(program: Command): void {
  const listCommand = program
    .command('list')
    .description('List SHC resources');

  // List collections subcommand
  listCommand
    .command('collections')
    .alias('c')
    .description('List all collections')
    .option('-c, --config <PATH>', 'Config file path')
    .option('--collection-dir <dir>', 'Collection directory')
    .action(async (options: Record<string, unknown>) => {
      try {
        // Get effective options
        const effectiveOptions = await getEffectiveOptions(options);

        // Get collection directory
        const collectionDir = await getCollectionDir(effectiveOptions);

        // Display collections
        await listCollections(collectionDir);
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
        // Get effective options
        const effectiveOptions = await getEffectiveOptions(options);

        // Get collection directory
        const collectionDir = await getCollectionDir(effectiveOptions);

        // Display requests
        await listRequests(collectionDir, collection);
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
    console.error(chalk.red(`Failed to load collections: ${error instanceof Error ? error.message : String(error)}`));
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
    requests.forEach((request, index) => {
      console.log(`${chalk.cyan(`${index + 1}.`)} ${request}`);
    });
    console.log(); // Empty line for spacing
  } catch (error) {
    console.error(chalk.red(`Failed to load requests: ${error instanceof Error ? error.message : String(error)}`));
    throw error;
  }
}
