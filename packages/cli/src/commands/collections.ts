import { Command } from 'commander';
import type { Collection, VariableSet, Request } from '@shc/core';
import { createConfig } from '../config.js';
import { saveCollection, deleteCollection } from '../storage.js';
import crypto from 'crypto';
import inquirer from 'inquirer';

export function createCollectionsCommand(config: ReturnType<typeof createConfig>) {
  const command = new Command('collections');

  command
    .command('list')
    .description('List all collections')
    .action(() => {
      const collections = config.get('collections');
      console.log('\nCollections');
      console.log('---------------');
      
      if (collections.length === 0) {
        console.log('No collections found');
        return;
      }

      collections.forEach((collection: Collection) => {
        console.log(`\n${collection.name}`);
        if (collection.description) {
          console.log(collection.description);
        }
        console.log('\nRequests:');
        collection.requests.forEach((request: Request) => {
          console.log(`- ${request.name}: ${request.config.method} ${request.config.url}`);
        });
      });
    });

  command
    .command('create [name]')
    .description('Create a new collection')
    .action(async (name?: string) => {
      let collectionName = name;
      if (!collectionName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Collection name:',
            validate: (input) => input.length > 0 || 'Name is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Collection description (optional):'
          }
        ]) as { name: string; description?: string };
        collectionName = answers.name;
        const collection: Collection = {
          id: Date.now().toString(),
          name: collectionName,
          description: answers.description || undefined,
          requests: [],
        };
        saveCollection(config, collection);
      } else {
        const collection: Collection = {
          id: Date.now().toString(),
          name: collectionName,
          requests: [],
        };
        saveCollection(config, collection);
      }
      console.log(`Collection created: ${collectionName}`);
    });

  command
    .command('delete [name]')
    .description('Delete a collection')
    .action(async (name?: string) => {
      if (!name) {
        const collections = config.get('collections');
        if (collections.length === 0) {
          console.error('No collections found');
          process.exit(1);
          return;
        }

        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'collection',
            message: 'Select collection to delete:',
            choices: collections.map(c => c.name)
          },
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to delete this collection?',
            default: false
          }
        ]);

        if (answers.confirm) {
          deleteCollection(config, answers.collection);
          console.log(`Collection deleted: ${answers.collection}`);
        }
      } else {
        const collections = config.get('collections');
        const collection = collections.find((c: Collection) => c.name === name);
        if (!collection) {
          console.error(`Collection not found: ${name}`);
          process.exit(1);
          return;
        }
        deleteCollection(config, name);
        console.log(`Collection deleted: ${name}`);
      }
    });

  command
    .command('add-variable-set <collection> <n>')
    .description('Add a variable set to a collection')
    .action((collectionName: string, variableSetName: string) => {
      const collections = config.get('collections');
      const collection = collections.find((c: Collection) => c.name === collectionName);
      if (!collection) {
        console.error(`Collection not found: ${collectionName}`);
        process.exit(1);
        return;
      }

      if (!collection.variableSets) {
        collection.variableSets = [];
      }

      const variableSet: VariableSet = {
        id: crypto.randomUUID(),
        name: variableSetName,
        variables: {},
      };

      collection.variableSets.push(variableSet);
      saveCollection(config, collection);
      console.log(`Variable set created: ${variableSetName}`);
    });

  command
    .command('remove-variable-set <collection> <id>')
    .description('Remove a variable set from a collection')
    .action((collectionName: string, variableSetId: string) => {
      const collections = config.get('collections');
      const collection = collections.find((c: Collection) => c.name === collectionName);
      if (!collection) {
        console.error(`Collection not found: ${collectionName}`);
        process.exit(1);
        return;
      }

      if (!collection.variableSets) {
        collection.variableSets = [];
      }

      const index = collection.variableSets.findIndex((vs: VariableSet) => vs.id === variableSetId);
      if (index === -1) {
        console.error(`Variable set not found: ${variableSetId}`);
        process.exit(1);
        return;
      }

      collection.variableSets.splice(index, 1);
      saveCollection(config, collection);
      console.log(`Variable set removed: ${variableSetId}`);
    });

  command
    .command('list-variable-sets <collection>')
    .description('List all variable sets in a collection')
    .action((collectionName: string) => {
      const collections = config.get('collections');
      const collection = collections.find((c: Collection) => c.name === collectionName);
      if (!collection) {
        console.error(`Collection not found: ${collectionName}`);
        process.exit(1);
        return;
      }

      console.log(`\nVariable Sets for ${collection.name}`);
      console.log('---------------');

      if (!collection.variableSets || collection.variableSets.length === 0) {
        console.log('No variable sets found');
        return;
      }

      collection.variableSets.forEach((vs: VariableSet) => {
        console.log(`\n${vs.name} (${vs.id})`);
        if (vs.description) {
          console.log(vs.description);
        }
        console.log('\nVariables:');
        Object.entries(vs.variables).forEach(([key, value]) => {
          console.log(`- ${key}: ${value}`);
        });
      });
    });

  command.on('command:*', () => {
    console.error('Unknown command');
    process.exit(1);
  });

  return command;
}

export const collections = createCollectionsCommand(createConfig());
