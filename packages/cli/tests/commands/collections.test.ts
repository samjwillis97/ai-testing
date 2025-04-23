import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollectionsCommand } from '../../src/commands/collections.js';
import { createConfig } from '../../src/config.js';
import type { Collection } from '@shc/core';
import inquirer from 'inquirer';
import crypto from 'crypto';
import Conf from 'conf';

// Mock dependencies
vi.mock('../../src/config.js', () => ({
  createConfig: vi.fn(() => {
    const store: { collections: Collection[] } = {
      collections: []
    };
    return {
      get: vi.fn((key: keyof typeof store) => store[key]),
      set: vi.fn((key: keyof typeof store, value: typeof store[keyof typeof store]) => {
        store[key] = value;
      }),
      path: '',
      store,
    };
  }),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock('crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'test-uuid'),
  },
}));

describe('collections command', () => {
  let mockStore: { collections: Collection[] };
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockConfig = {
    get: mockGet,
    set: mockSet,
    path: '',
    store: {},
  } as unknown as Conf<{ collections: Collection[] }>;
  const collections = createCollectionsCommand(mockConfig);
  const consoleSpy = vi.spyOn(console, 'log');
  const consoleErrorSpy = vi.spyOn(console, 'error');
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockPrompt = inquirer.prompt as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStore = { collections: [] };
    mockGet.mockImplementation((key: keyof typeof mockStore) => mockStore[key]);
    mockSet.mockImplementation((key: keyof typeof mockStore, value: typeof mockStore[keyof typeof mockStore]) => {
      mockStore[key] = value;
    });
    mockSet.mockClear();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    mockExit.mockClear();
    mockPrompt.mockClear();
  });

  describe('list command', () => {
    it('should show message when no collections exist', async () => {
      await collections.parseAsync(['node', 'shc.js', 'list']);
      expect(consoleSpy).toHaveBeenCalledWith('No collections found');
    });

    it('should list collections with their requests', async () => {
      const mockCollections = [{
        id: '1',
        name: 'Test Collection',
        description: 'Test Description',
        requests: [
          {
            id: '1',
            name: 'Test Request',
            config: {
              method: 'GET',
              url: 'http://example.com',
            },
          },
        ],
      }];
      mockGet.mockReturnValue(mockCollections);

      await collections.parseAsync(['node', 'shc.js', 'list']);

      expect(consoleSpy).toHaveBeenCalledWith('\nTest Collection');
      expect(consoleSpy).toHaveBeenCalledWith('Test Description');
      expect(consoleSpy).toHaveBeenCalledWith('\nRequests:');
      expect(consoleSpy).toHaveBeenCalledWith('- Test Request: GET http://example.com');
    });
  });

  describe('create command', () => {
    it('should create a collection with provided name', async () => {
      const expectedCollection: Collection = {
        id: expect.any(String),
        name: 'New Collection',
        requests: [],
      };

      await collections.parseAsync(['node', 'shc.js', 'create', 'New Collection']);

      expect(mockSet).toHaveBeenCalledWith('collections', [expectedCollection]);
      expect(consoleSpy).toHaveBeenCalledWith('Collection created: New Collection');
    });

    it('should create a collection with prompted name and description', async () => {
      mockPrompt.mockResolvedValueOnce({
        name: 'New Collection',
        description: 'New Description',
      });

      const expectedCollection: Collection = {
        id: expect.any(String),
        name: 'New Collection',
        description: 'New Description',
        requests: [],
      };

      await collections.parseAsync(['node', 'shc.js', 'create']);

      expect(mockSet).toHaveBeenCalledWith('collections', [expectedCollection]);
      expect(consoleSpy).toHaveBeenCalledWith('Collection created: New Collection');
    });
  });

  describe('delete command', () => {
    it('should delete a collection with provided name', async () => {
      const mockCollections = [
        { id: '1', name: 'Test Collection', requests: [] },
      ];
      mockGet.mockReturnValue(mockCollections);

      await collections.parseAsync(['node', 'shc.js', 'delete', 'Test Collection']);

      expect(mockSet).toHaveBeenCalledWith('collections', []);
      expect(consoleSpy).toHaveBeenCalledWith('Collection deleted: Test Collection');
    });

    it('should handle interactive deletion with confirmation', async () => {
      const mockCollections = [
        { id: '1', name: 'Test Collection', requests: [] },
      ];
      mockGet.mockReturnValue(mockCollections);

      mockPrompt.mockResolvedValueOnce({
        collection: 'Test Collection',
        confirm: true,
      });

      await collections.parseAsync(['node', 'shc.js', 'delete']);

      expect(mockSet).toHaveBeenCalledWith('collections', []);
      expect(consoleSpy).toHaveBeenCalledWith('Collection deleted: Test Collection');
    });

    it('should not delete when user does not confirm', async () => {
      const mockCollections = [
        { id: '1', name: 'Test Collection', requests: [] },
      ];
      mockGet.mockReturnValue(mockCollections);

      mockPrompt.mockResolvedValueOnce({
        collection: 'Test Collection',
        confirm: false,
      });

      await collections.parseAsync(['node', 'shc.js', 'delete']);

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should handle no collections found during interactive deletion', async () => {
      mockGet.mockReturnValue([]);

      await collections.parseAsync(['node', 'shc.js', 'delete']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('No collections found');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('variable set commands', () => {
    let mockCollection: Collection;

    beforeEach(() => {
      mockCollection = {
        id: '1',
        name: 'Test Collection',
        requests: [],
        variableSets: [],
      };
    });

    it('should add a variable set to a collection', async () => {
      mockGet.mockReturnValue([mockCollection]);

      await collections.parseAsync(['node', 'shc.js', 'add-variable-set', 'Test Collection', 'Test Variables']);

      expect(mockSet).toHaveBeenCalledWith('collections', [
        expect.objectContaining({
          ...mockCollection,
          variableSets: [
            {
              id: 'test-uuid',
              name: 'Test Variables',
              variables: {},
            },
          ],
        }),
      ]);
      expect(consoleSpy).toHaveBeenCalledWith('Variable set created: Test Variables');
    });

    it('should handle collection not found when adding variable set', async () => {
      mockGet.mockReturnValue([]);

      await collections.parseAsync(['node', 'shc.js', 'add-variable-set', 'Nonexistent', 'Test Variables']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Collection not found: Nonexistent');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should remove a variable set from a collection', async () => {
      const collectionWithVariableSet = {
        ...mockCollection,
        variableSets: [
          {
            id: 'test-uuid',
            name: 'Test Variables',
            variables: {},
          },
        ],
      };
      mockGet.mockReturnValue([collectionWithVariableSet]);

      await collections.parseAsync(['node', 'shc.js', 'remove-variable-set', 'Test Collection', 'test-uuid']);

      expect(mockSet).toHaveBeenCalledWith('collections', [
        expect.objectContaining({
          ...mockCollection,
          variableSets: [],
        }),
      ]);
      expect(consoleSpy).toHaveBeenCalledWith('Variable set removed: test-uuid');
    });

    it('should handle collection not found when removing variable set', async () => {
      mockGet.mockReturnValue([]);

      await collections.parseAsync(['node', 'shc.js', 'remove-variable-set', 'Nonexistent', 'test-uuid']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Collection not found: Nonexistent');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle variable set not found when removing', async () => {
      mockGet.mockReturnValue([mockCollection]);

      await collections.parseAsync(['node', 'shc.js', 'remove-variable-set', 'Test Collection', 'nonexistent-uuid']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Variable set not found: nonexistent-uuid');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should list variable sets in a collection', async () => {
      const collectionWithVariableSet = {
        ...mockCollection,
        variableSets: [
          {
            id: 'test-uuid',
            name: 'Test Variables',
            description: 'Test Description',
            variables: {
              key: 'value',
            },
          },
        ],
      };
      mockGet.mockReturnValue([collectionWithVariableSet]);

      await collections.parseAsync(['node', 'shc.js', 'list-variable-sets', 'Test Collection']);

      expect(consoleSpy).toHaveBeenCalledWith('\nVariable Sets for Test Collection');
      expect(consoleSpy).toHaveBeenCalledWith('---------------');
      expect(consoleSpy).toHaveBeenCalledWith('\nTest Variables (test-uuid)');
      expect(consoleSpy).toHaveBeenCalledWith('Test Description');
      expect(consoleSpy).toHaveBeenCalledWith('\nVariables:');
      expect(consoleSpy).toHaveBeenCalledWith('- key: value');
    });

    it('should handle collection not found when listing variable sets', async () => {
      mockGet.mockReturnValue([]);

      await collections.parseAsync(['node', 'shc.js', 'list-variable-sets', 'Nonexistent']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Collection not found: Nonexistent');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle no variable sets found when listing', async () => {
      mockGet.mockReturnValue([mockCollection]);

      await collections.parseAsync(['node', 'shc.js', 'list-variable-sets', 'Test Collection']);

      expect(consoleSpy).toHaveBeenCalledWith('\nVariable Sets for Test Collection');
      expect(consoleSpy).toHaveBeenCalledWith('---------------');
      expect(consoleSpy).toHaveBeenCalledWith('No variable sets found');
    });
  });

  it('should handle unknown commands', async () => {
    await collections.parseAsync(['node', 'shc.js', 'unknown']);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
