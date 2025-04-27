/**
 * Interactive mode command
 */
import { Command, Option } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import path from 'path';
import { SHCClient, ConfigManager } from '@shc/core';
import { RequestOptions, OutputOptions, HttpMethod, RequestInfo } from '../types.js';
import { printResponse, printError } from '../utils/output.js';
import { getEffectiveOptions, getCollectionDir, createConfigManagerFromOptions } from '../utils/config.js';
import { getRequest, saveRequest, getCollections, getRequests } from '../utils/collections.js';
import { createInteractiveTUI, createRequestForm, displayResponse } from '../utils/tui.js';

/**
 * Add interactive command to program
 */
export function addInteractiveCommand(program: Command): void {
  program
    .command('interactive')
    .alias('i')
    .description('Interactive mode')
    .option('-c, --config <PATH>', 'Config file path')
    .option('--collection-dir <dir>', 'Collection directory')
    .option('-o, --output <format>', 'Output format (json, yaml, raw, table)', 'json')
    .option('-v, --verbose', 'Verbose output')
    .option('-s, --silent', 'Silent mode')
    .option('--no-fullscreen', 'Disable full-screen TUI mode')
    .addOption(new Option('--no-color', 'Disable colors'))
    .action(async (options: Record<string, unknown>) => {
      try {
        // Create config manager from options
        const configManager = await createConfigManagerFromOptions(options);
        
        // Get effective options (for backward compatibility)
        const effectiveOptions = await getEffectiveOptions(options);

        // Get collection directory from config manager
        const collectionDir = configManager.get('storage.collections.path', 
          await getCollectionDir(effectiveOptions));

        // Create collection directory if it doesn't exist
        try {
          await fs.mkdir(collectionDir, { recursive: true });
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
            console.error(
              chalk.red(
                `Failed to create collection directory: ${error instanceof Error ? error.message : String(error)}`
              )
            );
            process.exit(1);
          }
        }

        // Prepare output options
        const outputOptions: OutputOptions = {
          format: (options.output as 'json' | 'yaml' | 'raw' | 'table') || 'json',
          color: options.color !== false,
          verbose: Boolean(options.verbose),
          silent: Boolean(options.silent)
        };

        // Check if full-screen mode is enabled (default is true)
        const fullscreenMode = options.fullscreen !== false;

        if (fullscreenMode) {
          // Start full-screen TUI mode
          const tui = createInteractiveTUI();
          tui.start();
        } else {
          // Start classic interactive mode
          console.log(chalk.bold('SHC Interactive Mode'));
          console.log('Type "exit" or press Ctrl+C to exit\n');

          // Display config information
          if (options.config) {
            console.log(`Config loaded from: ${options.config}`);
          }
          console.log(`Collection directory: ${collectionDir}`);
          console.log(`HTTP timeout: ${configManager.get('core.http.timeout', 30000)} ms\n`);

          // Start interactive loop
          let running = true;
          while (running) {
            const { action } = await inquirer.prompt([
              {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                  { name: 'Create a new request', value: 'create' },
                  { name: 'Execute a request', value: 'execute' },
                  { name: 'Manage collections', value: 'manage' },
                  { name: 'Exit', value: 'exit' },
                ],
              },
            ]);

            switch (action) {
              case 'create':
                await createRequest(collectionDir, outputOptions);
                break;
              case 'execute':
                await executeRequest(collectionDir, outputOptions);
                break;
              case 'manage':
                await manageCollections(collectionDir);
                break;
              case 'exit':
                running = false;
                break;
            }
          }

          console.log(chalk.green('\nThank you for using SHC Interactive Mode!'));
        }
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });
}

/**
 * Create a new request
 */
async function createRequest(collectionDir: string, outputOptions: OutputOptions): Promise<void> {
  // Get request details
  const { method, url } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'Select HTTP method:',
      choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    },
    {
      type: 'input',
      name: 'url',
      message: 'Enter URL:',
      validate: (input: string): boolean | string => input.trim() !== '' || 'URL is required',
    },
  ]);

  // Initialize request options
  const requestOptions: RequestOptions = {
    method: method as HttpMethod,
    url,
    headers: {},
    params: {},
  };

  // Get headers
  const { addHeaders } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addHeaders',
      message: 'Add headers?',
      default: false,
    },
  ]);

  if (addHeaders) {
    let addMoreHeaders = true;
    while (addMoreHeaders) {
      const { key, value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Header name:',
          validate: (input: string): boolean | string =>
            input.trim() !== '' || 'Header name is required',
        },
        {
          type: 'input',
          name: 'value',
          message: 'Header value:',
          validate: (input: string): boolean | string =>
            input.trim() !== '' || 'Header value is required',
        },
      ]);

      requestOptions.headers![key] = value;

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another header?',
          default: false,
        },
      ]);

      addMoreHeaders = more;
    }
  }

  // Get query parameters
  const { addParams } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addParams',
      message: 'Add query parameters?',
      default: false,
    },
  ]);

  if (addParams) {
    let addMoreParams = true;
    while (addMoreParams) {
      const { key, value } = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Parameter name:',
          validate: (input: string): boolean | string =>
            input.trim() !== '' || 'Parameter name is required',
        },
        {
          type: 'input',
          name: 'value',
          message: 'Parameter value:',
          validate: (input: string): boolean | string =>
            input.trim() !== '' || 'Parameter value is required',
        },
      ]);

      requestOptions.params![key] = value;

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another parameter?',
          default: false,
        },
      ]);

      addMoreParams = more;
    }
  }

  // Get request body for methods that support it
  if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
    const { addBody } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addBody',
        message: 'Add request body?',
        default: false,
      },
    ]);

    if (addBody) {
      const { bodyType } = await inquirer.prompt([
        {
          type: 'list',
          name: 'bodyType',
          message: 'Select body type:',
          choices: ['JSON', 'Text'],
        },
      ]);

      if (bodyType === 'JSON') {
        const { body } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'body',
            message: 'Enter JSON body:',
            validate: (input: string): boolean | string => {
              try {
                JSON.parse(input);
                return true;
              } catch (error) {
                return 'Invalid JSON';
              }
            },
          },
        ]);

        requestOptions.data = JSON.parse(body);
      } else {
        const { body } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'body',
            message: 'Enter text body:',
          },
        ]);

        requestOptions.data = body;
      }
    }
  }

  // Execute request
  const spinner = ora(`Sending ${method.toUpperCase()} request to ${url}`).start();
  try {
    const client = SHCClient.create();
    const response = await client.request(requestOptions);
    spinner.succeed(chalk.green('Response received'));
    printResponse(response, outputOptions);

    // Ask if user wants to save the request
    const { saveToCollection } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'saveToCollection',
        message: 'Save this request to a collection?',
        default: false,
      },
    ]);

    if (saveToCollection) {
      await saveRequestToCollection(collectionDir, requestOptions);
    }
  } catch (error) {
    spinner.fail(chalk.red('Request failed'));
    printError(error, outputOptions);
  }
}

/**
 * Execute a request
 */
async function executeRequest(collectionDir: string, outputOptions: OutputOptions): Promise<void> {
  try {
    // Get available collections
    let collections: string[] = [];
    try {
      collections = await getCollections(collectionDir);
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to get collections: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    if (collections.length === 0) {
      console.log(chalk.yellow('No collections found.'));
      return;
    }

    // Select collection
    const { collection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select collection:',
        choices: collections,
      },
    ]);

    // Get available requests
    let requests: RequestInfo[] = [];
    try {
      requests = await getRequests(collectionDir, collection);
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to get requests: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    if (requests.length === 0) {
      console.log(chalk.yellow(`No requests found in collection '${collection}'.`));
      return;
    }

    // Prompt for request
    const { requestId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'requestId',
        message: 'Select request:',
        choices: requests.map(req => ({
          name: `${req.name} ${req.method ? `(${req.method})` : ''}`,
          value: req.id
        })),
      },
    ]);

    // Get request from collection
    const spinner = ora(`Loading request '${requestId}' from collection '${collection}'`).start();
    try {
      const requestOptions = await getRequest(collectionDir, collection, requestId);
      spinner.succeed(chalk.green(`Request loaded from collection`));

      // Execute request
      const requestSpinner = ora(
        `Sending ${requestOptions.method.toUpperCase()} request to ${requestOptions.url}`
      ).start();
      try {
        const client = SHCClient.create();
        const response = await client.request(requestOptions);
        requestSpinner.succeed(chalk.green('Response received'));
        printResponse(response, outputOptions);
      } catch (error) {
        requestSpinner.fail(chalk.red('Request failed'));
        printError(error, outputOptions);
      }
    } catch (error) {
      spinner.fail(chalk.red(`Failed to load request`));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Manage collections
 */
async function manageCollections(collectionDir: string): Promise<void> {
  let managing = true;
  while (managing) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'List collections', value: 'list' },
          { name: 'Delete collection', value: 'delete' },
          { name: 'Rename collection', value: 'rename' },
          { name: 'Export collection', value: 'export' },
          { name: 'Import collection', value: 'import' },
          { name: 'Back', value: 'back' },
        ],
      },
    ]);

    switch (action) {
      case 'list':
        await listCollectionsAction(collectionDir);
        break;
      case 'delete':
        await deleteCollectionAction(collectionDir);
        break;
      case 'rename':
        await renameCollectionAction(collectionDir);
        break;
      case 'export':
        await exportCollectionAction(collectionDir);
        break;
      case 'import':
        await importCollectionAction(collectionDir);
        break;
      case 'back':
        managing = false;
        break;
    }
  }
}

/**
 * List collections
 */
async function listCollectionsAction(collectionDir: string): Promise<void> {
  try {
    const spinner = ora('Loading collections').start();
    try {
      const collections = await getCollections(collectionDir);
      spinner.succeed(chalk.green('Collections loaded'));

      if (collections.length === 0) {
        console.log(chalk.yellow('No collections found.'));
        return;
      }

      console.log(chalk.blue('\nCollections:'));
      for (const collection of collections) {
        console.log(`- ${collection}`);
      }
      console.log('');
    } catch (error) {
      spinner.fail(chalk.red('Failed to load collections'));
      throw error;
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Delete collection
 */
async function deleteCollectionAction(collectionDir: string): Promise<void> {
  try {
    // Get available collections
    let collections: string[] = [];
    try {
      collections = await getCollections(collectionDir);
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to get collections: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    if (collections.length === 0) {
      console.log(chalk.yellow('No collections found.'));
      return;
    }

    // Select collection
    const { collection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select collection to delete:',
        choices: collections,
      },
    ]);

    // Confirm deletion
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete collection '${collection}'?`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.blue('Deletion cancelled.'));
      return;
    }

    // Delete collection
    const spinner = ora(`Deleting collection '${collection}'`).start();
    try {
      const collectionPath = path.join(collectionDir, `${collection}.json`);
      await fs.unlink(collectionPath);
      spinner.succeed(chalk.green(`Collection '${collection}' deleted`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to delete collection'));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Save request to collection
 */
async function saveRequestToCollection(
  collectionDir: string,
  requestOptions: RequestOptions
): Promise<void> {
  try {
    // Get available collections
    let collections: string[] = [];
    try {
      collections = await getCollections(collectionDir);
    } catch (error) {
      // Ignore error if collections directory doesn't exist
    }

    // Ask for collection
    let { collection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select collection:',
        choices: [...collections, { name: 'Create new collection', value: 'new' }],
      },
    ]);

    // Create new collection if selected
    if (collection === 'new') {
      const { newCollection } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newCollection',
          message: 'Enter new collection name:',
          validate: (input: string): boolean | string =>
            input.trim() !== '' || 'Collection name is required',
        },
      ]);

      collection = newCollection;
    }

    // Get request name
    const { requestName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'requestName',
        message: 'Enter request name:',
        validate: (input: string): boolean | string =>
          input.trim() !== '' || 'Request name is required',
      },
    ]);

    // Save request
    const spinner = ora(`Saving request to collection`).start();
    await saveRequest(collectionDir, collection, requestName, requestOptions);
    spinner.succeed(chalk.green(`Request saved to collection '${collection}' as '${requestName}'`));
  } catch (error) {
    console.error(
      chalk.red(`Failed to save request: ${error instanceof Error ? error.message : String(error)}`)
    );
  }
}

/**
 * Rename collection
 */
async function renameCollectionAction(collectionDir: string): Promise<void> {
  try {
    // Get available collections
    let collections: string[] = [];
    try {
      collections = await getCollections(collectionDir);
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to get collections: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    if (collections.length === 0) {
      console.log(chalk.yellow('No collections found.'));
      return;
    }

    // Select collection
    const { collection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select collection to rename:',
        choices: collections,
      },
    ]);

    // Get new name
    const { newName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newName',
        message: 'Enter new collection name:',
        validate: (input: string): boolean | string =>
          input.trim() !== '' || 'Collection name is required',
      },
    ]);

    // Rename collection
    const spinner = ora(`Renaming collection '${collection}' to '${newName}'`).start();
    try {
      const oldCollectionPath = path.join(collectionDir, `${collection}.json`);
      const newCollectionPath = path.join(collectionDir, `${newName}.json`);
      await fs.rename(oldCollectionPath, newCollectionPath);
      spinner.succeed(chalk.green(`Collection '${collection}' renamed to '${newName}'`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to rename collection`));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Export collection
 */
async function exportCollectionAction(collectionDir: string): Promise<void> {
  try {
    // Get available collections
    let collections: string[] = [];
    try {
      collections = await getCollections(collectionDir);
    } catch (error) {
      console.error(
        chalk.red(
          `Failed to get collections: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }

    if (collections.length === 0) {
      console.log(chalk.yellow('No collections found.'));
      return;
    }

    // Select collection
    const { collection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select collection to export:',
        choices: collections,
      },
    ]);

    // Get export path
    const { exportPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'exportPath',
        message: 'Enter export path:',
        validate: (input: string): boolean | string =>
          input.trim() !== '' || 'Export path is required',
      },
    ]);

    // Export collection
    const spinner = ora(`Exporting collection '${collection}' to '${exportPath}'`).start();
    try {
      const collectionPath = path.join(collectionDir, `${collection}.json`);
      await fs.copyFile(collectionPath, exportPath);
      spinner.succeed(chalk.green(`Collection '${collection}' exported to '${exportPath}'`));
    } catch (error) {
      spinner.fail(chalk.red(`Failed to export collection`));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}

/**
 * Import collection
 */
async function importCollectionAction(collectionDir: string): Promise<void> {
  try {
    // Get import path
    const { importPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'importPath',
        message: 'Enter import path:',
        validate: (input: string): boolean | string =>
          input.trim() !== '' || 'Import path is required',
      },
    ]);

    // Get collection name
    const { collectionName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'collectionName',
        message: 'Enter collection name:',
        validate: (input: string): boolean | string =>
          input.trim() !== '' || 'Collection name is required',
      },
    ]);

    // Import collection
    const spinner = ora(`Importing collection from '${importPath}' to '${collectionName}'`).start();
    try {
      const collectionPath = path.join(collectionDir, `${collectionName}.json`);
      await fs.copyFile(importPath, collectionPath);
      spinner.succeed(
        chalk.green(`Collection imported from '${importPath}' to '${collectionName}'`)
      );
    } catch (error) {
      spinner.fail(chalk.red(`Failed to import collection`));
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
  }
}
