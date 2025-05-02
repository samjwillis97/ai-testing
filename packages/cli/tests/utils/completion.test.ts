/**
 * Tests for completion utility
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the functions we want to test
import * as completionUtils from '../../src/utils/completion';

// Mock dependencies
vi.mock('../../src/utils/collections', () => ({
  getCollections: vi.fn().mockImplementation((collectionDir) => {
    if (collectionDir === '/error/path') {
      return Promise.reject(new Error('Failed to get collections'));
    }
    return Promise.resolve(['test-collection', 'api-examples']);
  }),
  getRequests: vi.fn().mockImplementation((collectionDir, collectionName) => {
    if (collectionName === 'test-collection') {
      return Promise.resolve([
        { id: 'get-users', name: 'Get Users', method: 'GET', url: 'https://api.example.com/users' },
        { id: 'create-user', name: 'Create User', method: 'POST', url: 'https://api.example.com/users' },
      ]);
    } else if (collectionName === 'api-examples') {
      return Promise.resolve([
        { id: 'example1', name: 'Example 1', method: 'GET', url: 'https://api.example.com/example1' },
        { id: 'example2', name: 'Example 2', method: 'GET', url: 'https://api.example.com/example2' },
      ]);
    } else {
      return Promise.reject(new Error(`Collection '${collectionName}' not found`));
    }
  }),
}));

vi.mock('../../src/utils/config', () => ({
  getCollectionDir: vi.fn().mockImplementation((options) => {
    if (options && options.collectionDir) {
      return Promise.resolve(options.collectionDir);
    }
    return Promise.resolve('/default/collections/dir');
  }),
}));

vi.mock('../../src/plugins/index', () => ({
  cliPluginManager: {
    getShellCompletion: vi.fn().mockImplementation((shell) => {
      if (shell === 'custom-shell') {
        return (line, point) => {
          if (line === '' && point === 0) {
            return ['#!/bin/custom-shell\n# Custom shell completion script'];
          }
          return ['custom-completion-1', 'custom-completion-2'];
        };
      }
      return undefined;
    }),
  },
}));

// Import mocked modules
import * as collectionsUtils from '../../src/utils/collections';
import * as configUtils from '../../src/utils/config';
import { cliPluginManager } from '../../src/plugins/index';

describe('Completion Utility', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });
  
  describe('generateCompletionScript', () => {
    it('should generate bash completion script', () => {
      const script = completionUtils.generateCompletionScript('bash');
      expect(script).toContain('#!/usr/bin/env bash');
      expect(script).toContain('_shc_completion()');
      expect(script).toContain('complete -F _shc_completion shc');
    });
    
    it('should generate zsh completion script', () => {
      const script = completionUtils.generateCompletionScript('zsh');
      expect(script).toContain('#compdef shc');
      expect(script).toContain('_shc()');
      expect(script).toContain('_arguments');
    });
    
    it('should generate fish completion script', () => {
      const script = completionUtils.generateCompletionScript('fish');
      expect(script).toContain('function __shc_collections');
      expect(script).toContain('function __shc_requests');
      expect(script).toContain('complete -c shc');
    });
    
    it('should use plugin-provided completion script if available', () => {
      const script = completionUtils.generateCompletionScript('custom-shell' as any);
      expect(script).toBe('#!/bin/custom-shell\n# Custom shell completion script');
    });
    
    it('should throw error for unsupported shell', () => {
      expect(() => completionUtils.generateCompletionScript('powershell' as any)).toThrow('Unsupported shell: powershell');
    });
  });
  
  describe('getCollectionsForCompletion', () => {
    it('should get collections for completion', async () => {
      const collections = await completionUtils.getCollectionsForCompletion();
      
      // Verify that getCollectionDir was called
      expect(configUtils.getCollectionDir).toHaveBeenCalled();
      
      // Verify that getCollections was called with the collection directory
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('/default/collections/dir');
      
      // Verify that the collections were returned
      expect(collections).toEqual(['test-collection', 'api-examples']);
    });
    
    it('should use provided collection directory', async () => {
      const collections = await completionUtils.getCollectionsForCompletion({ collectionDir: '/custom/collections/dir' });
      
      // Verify that getCollectionDir was called with the options
      expect(configUtils.getCollectionDir).toHaveBeenCalledWith({ collectionDir: '/custom/collections/dir' });
      
      // Verify that getCollections was called with the collection directory
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('/custom/collections/dir');
      
      // Verify that the collections were returned
      expect(collections).toEqual(['test-collection', 'api-examples']);
    });
    
    it('should return empty array on error', async () => {
      // Make getCollections throw an error
      (collectionsUtils.getCollections as any).mockRejectedValueOnce(new Error('Test error'));
      
      const collections = await completionUtils.getCollectionsForCompletion();
      
      // Verify that the collections were returned as an empty array
      expect(collections).toEqual([]);
    });
  });
  
  describe('getRequestsForCompletion', () => {
    it('should get requests for completion', async () => {
      const requests = await completionUtils.getRequestsForCompletion('test-collection');
      
      // Verify that getCollectionDir was called
      expect(configUtils.getCollectionDir).toHaveBeenCalled();
      
      // Verify that getRequests was called with the collection directory and collection name
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/default/collections/dir', 'test-collection');
      
      // Verify that the requests were returned
      expect(requests).toEqual(['get-users', 'create-user']);
    });
    
    it('should use provided collection directory', async () => {
      const requests = await completionUtils.getRequestsForCompletion('test-collection', { collectionDir: '/custom/collections/dir' });
      
      // Verify that getCollectionDir was called with the options
      expect(configUtils.getCollectionDir).toHaveBeenCalledWith({ collectionDir: '/custom/collections/dir' });
      
      // Verify that getRequests was called with the collection directory and collection name
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/custom/collections/dir', 'test-collection');
      
      // Verify that the requests were returned
      expect(requests).toEqual(['get-users', 'create-user']);
    });
    
    it('should return empty array on error', async () => {
      // Verify that getCollectionDir was called
      const requests = await completionUtils.getRequestsForCompletion('non-existent-collection');
      
      // Verify that getRequests was called with the collection directory and collection name
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/default/collections/dir', 'non-existent-collection');
      
      // Verify that the requests were returned as an empty array
      expect(requests).toEqual([]);
    });
  });
});
