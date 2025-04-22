import { Command } from 'commander';
import inquirer from 'inquirer';
import Conf from 'conf';
import type { Collection, Request } from '@shc/core';

export const createConfig = () =>
  new Conf<{ collections: Collection[] }>({
    projectName: 'shc',
    defaults: {
      collections: [],
    },
  });

export const createCollectionsCommand = (config: Conf<{ collections: Collection[] }>) => {
  const listCollections = () => {
    try {
      const collections = config.get('collections');
      if (collections.length === 0) {
        console.log('No collections found');
        return;
      }

      collections.forEach((collection) => {
        console.log(`\n${collection.name}`);
        console.log('-'.repeat(collection.name.length));
        if (collection.description) {
          console.log(collection.description);
        }
        console.log('\nRequests:');
        collection.requests.forEach((request: Request) => {
          console.log(`- ${request.name}: ${request.config.method} ${request.config.url}`);
        });
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const createCollection = async () => {
    const { name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Collection name:',
        validate: (input) => input.length > 0,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Collection description (optional):',
      },
    ]);

    const collection: Collection = {
      id: Date.now().toString(),
      name,
      description,
      requests: [],
    };

    const collections = config.get('collections');
    collections.push(collection);
    config.set('collections', collections);

    console.log(`Collection created: ${name}`);
  };

  const addRequest = async () => {
    const collections = config.get('collections');
    if (collections.length === 0) {
      console.log('No collections found. Create a collection first.');
      return;
    }

    const { collectionId } = await inquirer.prompt({
      type: 'list',
      name: 'collectionId',
      message: 'Select a collection:',
      choices: collections.map((c) => ({ name: c.name, value: c.id })),
    });

    const { name, method, url, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Request name:',
        validate: (input) => input.length > 0,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Request description (optional):',
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP method:',
        choices: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      },
      {
        type: 'input',
        name: 'url',
        message: 'URL:',
        validate: (input) => input.length > 0,
      },
    ]);

    const request: Request = {
      id: Date.now().toString(),
      name,
      description,
      config: {
        method,
        url,
      },
    };

    const collectionIndex = collections.findIndex((c) => c.id === collectionId);
    collections[collectionIndex].requests.push(request);
    config.set('collections', collections);

    console.log('Request added successfully');
  };

  const deleteCollection = async () => {
    const collections = config.get('collections');
    if (collections.length === 0) {
      console.log('No collections found');
      return;
    }

    const { collection, confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'collection',
        message: 'Select a collection to delete:',
        choices: collections.map((c) => c.name),
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to delete this collection?',
        default: false,
      },
    ]);

    if (!confirm) {
      console.log('Operation cancelled');
      return;
    }

    const updatedCollections = collections.filter((c) => c.name !== collection);
    config.set('collections', updatedCollections);
    console.log(`Collection deleted: ${collection}`);
  };

  const collections = new Command()
    .name('collections')
    .description('Manage request collections')
    .argument('<command>', 'Command to execute')
    .action(async (command) => {
      switch (command) {
        case 'list':
          listCollections();
          break;
        case 'create':
          await createCollection();
          break;
        case 'add-request':
          await addRequest();
          break;
        case 'delete':
          await deleteCollection();
          break;
        default:
          console.error('Unknown command');
          process.exit(1);
      }
    });

  return collections;
};

export const collections = createCollectionsCommand(createConfig());
