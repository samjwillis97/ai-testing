import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Collection, Request, VariableSet, HTTPMethod } from '../../src/types/collection.types';
import { SHCConfig } from '../../src/types/client.types';
import { SHCClient } from '../../src/services/client';
import path from 'path';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
}));

// Import fs after mocking
import * as fs from 'fs/promises';

// Create a spy for the CollectionManager methods
const mockCreateCollection = vi.fn();
const mockLoadCollection = vi.fn();
const mockSaveCollection = vi.fn();

// Mock the CollectionManager class
vi.mock('../../src/services/collection-manager', () => ({
  createCollectionManager: () => ({
    createCollection: mockCreateCollection,
    loadCollection: mockLoadCollection,
    saveCollection: mockSaveCollection,
    deleteCollection: vi.fn(),
    addRequest: vi.fn(),
    updateRequest: vi.fn(),
    deleteRequest: vi.fn(),
    addGlobalVariableSet: vi.fn(),
    updateGlobalVariableSet: vi.fn(),
    getGlobalVariableSet: vi.fn(),
    setGlobalVariableSetValue: vi.fn(),
    addVariableSet: vi.fn(),
    updateVariableSet: vi.fn(),
    getVariableSet: vi.fn(),
    setVariableSetValue: vi.fn(),
    executeRequest: vi.fn(),
  }),
}));

describe('SHC Client Collection Integration', () => {
  // Create mock collection data
  const mockCollection: Collection = {
    name: 'test-collection',
    version: '1.0.0',
    requests: [
      {
        id: 'req1',
        name: 'Test Request',
        method: 'GET' as HTTPMethod,
        path: 'https://api.example.com/test',
        headers: { 'Content-Type': 'application/json' },
      },
    ],
    variableSets: [
      {
        name: 'default',
        activeValue: 'default',
        values: {
          default: {
            baseUrl: 'https://api.example.com',
            apiKey: 'test-api-key',
          },
        },
      },
    ],
  };

  const mockCollectionJson = JSON.stringify(mockCollection, null, 2);

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up mock implementations
    mockCreateCollection.mockResolvedValue(mockCollection);
    mockLoadCollection.mockResolvedValue(mockCollection);
    mockSaveCollection.mockResolvedValue(undefined);

    // Set up fs mocks
    vi.mocked(fs.readdir).mockResolvedValue([
      'collection1.json',
      'collection2.json',
      'not-a-collection.txt',
    ] as any);
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(mockCollectionJson as any);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Collection loading from config', () => {
    it('should load collections from items in config', async () => {
      // Create a config with collection items
      const config: SHCConfig = {
        collections: {
          items: [mockCollection],
        },
      };

      // Create a spy on the event emitter
      const eventSpy = vi.fn();

      // Create the client with the config
      const client = SHCClient.create(config);

      // Listen for collection:loaded events
      client.on('collection:loaded', eventSpy);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that createCollection was called
      expect(mockCreateCollection).toHaveBeenCalled();
    });

    it('should handle errors when loading collections', async () => {
      // Mock createCollection to throw an error
      mockCreateCollection.mockRejectedValueOnce(new Error('Failed to create collection'));

      // Create a config with collection items
      const config: SHCConfig = {
        collections: {
          items: [mockCollection],
        },
      };

      // Create a spy on the event emitter for errors
      const errorSpy = vi.fn();

      // Create the client with the config
      const client = SHCClient.create(config);

      // Listen for error events
      client.on('error', errorSpy);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that the error event was emitted
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      // Mock access to throw an error (directory doesn't exist)
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('Directory not found'));

      // Create a config with collection directory
      const config: SHCConfig = {
        collections: {
          directory: '/path/to/collections',
        },
      };

      // Create the client with the config
      const client = SHCClient.create(config);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that mkdir was called to create the directory
      expect(fs.mkdir).toHaveBeenCalledWith('/path/to/collections', { recursive: true });
    });

    it('should load collections from a directory', async () => {
      // Create a config with collection directory
      const config: SHCConfig = {
        collections: {
          directory: '/path/to/collections',
        },
      };

      // Create the client with the config
      const client = SHCClient.create(config);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that readdir was called with the correct path
      expect(fs.readdir).toHaveBeenCalledWith('/path/to/collections');
    });

    it('should load collections from specific paths', async () => {
      // Create a config with collection paths
      const config: SHCConfig = {
        collections: {
          paths: ['/path/to/collection1.json', '/path/to/collection2.json'],
        },
      };

      // Create the client with the config
      const client = SHCClient.create(config);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify that loadCollection was called for each path
      expect(mockLoadCollection).toHaveBeenCalledTimes(2);
    });
  });
});
