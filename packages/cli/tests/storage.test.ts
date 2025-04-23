import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadCollection, saveCollection, deleteCollection } from '../src/storage.js';
import { createConfig } from '../src/config.js';
import type { Collection } from '@shc/core';

// Mock the config
vi.mock('../src/config.js', () => {
  const mockConfig = {
    get: vi.fn(),
    set: vi.fn(),
  };
  return {
    createConfig: () => mockConfig,
  };
});

describe('storage', () => {
  const config = createConfig();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (config.get as any).mockReturnValue([]);
  });

  describe('loadCollection', () => {
    it('should return undefined when collection not found', () => {
      const result = loadCollection(config, 'nonexistent');
      expect(result).toBeUndefined();
      expect(config.get).toHaveBeenCalledWith('collections');
    });

    it('should return collection when found', () => {
      const testCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [],
        description: 'Test collection',
        environments: [],
        variableSets: []
      };
      (config.get as any).mockReturnValue([testCollection]);
      
      const result = loadCollection(config, 'test');
      expect(result).toEqual(testCollection);
      expect(config.get).toHaveBeenCalledWith('collections');
    });
  });

  describe('saveCollection', () => {
    it('should add new collection when not exists', () => {
      const testCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [],
        description: 'Test collection',
        environments: [],
        variableSets: []
      };
      
      saveCollection(config, testCollection);
      
      expect(config.get).toHaveBeenCalledWith('collections');
      expect(config.set).toHaveBeenCalledWith('collections', [testCollection]);
    });

    it('should update existing collection', () => {
      const existingCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [],
        description: 'Test collection',
        environments: [],
        variableSets: []
      };
      const updatedCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [{ 
          id: '1',
          name: 'Test Request',
          config: {
            method: 'GET',
            url: 'http://example.com'
          }
        }],
        description: 'Updated collection',
        environments: [],
        variableSets: []
      };
      (config.get as any).mockReturnValue([existingCollection]);
      
      saveCollection(config, updatedCollection);
      
      expect(config.get).toHaveBeenCalledWith('collections');
      expect(config.set).toHaveBeenCalledWith('collections', [updatedCollection]);
    });
  });

  describe('deleteCollection', () => {
    it('should remove collection when exists', () => {
      const testCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [],
        description: 'Test collection',
        environments: [],
        variableSets: []
      };
      (config.get as any).mockReturnValue([testCollection]);
      
      deleteCollection(config, 'test');
      
      expect(config.get).toHaveBeenCalledWith('collections');
      expect(config.set).toHaveBeenCalledWith('collections', []);
    });

    it('should not modify collections when collection not found', () => {
      const testCollection: Collection = { 
        id: '1',
        name: 'test', 
        requests: [],
        description: 'Test collection',
        environments: [],
        variableSets: []
      };
      (config.get as any).mockReturnValue([testCollection]);
      
      deleteCollection(config, 'nonexistent');
      
      expect(config.get).toHaveBeenCalledWith('collections');
      expect(config.set).not.toHaveBeenCalled();
    });
  });
}); 