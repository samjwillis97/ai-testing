import type { Collection } from '@shc/core';
import type { createConfig } from './config.js';

export function loadCollection(config: ReturnType<typeof createConfig>, name: string): Collection | undefined {
  const collections = config.get('collections');
  return collections.find((c: Collection) => c.name === name);
}

export function saveCollection(config: ReturnType<typeof createConfig>, collection: Collection): void {
  const collections = config.get('collections');
  const index = collections.findIndex((c: Collection) => c.name === collection.name);
  
  if (index >= 0) {
    collections[index] = collection;
  } else {
    collections.push(collection);
  }
  
  config.set('collections', collections);
}

export function deleteCollection(config: ReturnType<typeof createConfig>, name: string): void {
  const collections = config.get('collections');
  const index = collections.findIndex((c: Collection) => c.name === name);
  
  if (index >= 0) {
    collections.splice(index, 1);
    config.set('collections', collections);
  }
} 