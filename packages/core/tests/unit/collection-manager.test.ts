import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import { Collection, Request, VariableSet } from '../../src/types/collection.types';
import { CollectionManagerImpl } from '../../src/services/collection-manager';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('../../src/services/client');
vi.mock('../../src/config-manager');

// Import mocked modules
import fs from 'fs/promises';
import { SHCClient } from '../../src/services/client';
import { ConfigManagerImpl } from '../../src/config-manager';

// Mock data
const mockCollection: Collection = {
  name: 'test-collection',
  version: '1.0.0',
  baseUrl: 'https://api.example.com',
  variableSets: [
    {
      name: 'user',
      description: 'User information',
      defaultValue: 'john',
      activeValue: 'john',
      values: {
        john: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          apiKey: 'johns-api-key',
        },
        jane: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          apiKey: 'janes-api-key',
        },
      },
    },
  ],
  requests: [
    {
      id: 'get-user-profile',
      name: 'Get User Profile',
      method: 'GET',
      path: '/users/profile',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': '${variables.user.apiKey}',
        'X-User-Email': '${variables.user.email}',
      },
      query: {
        debug: 'true',
      },
    },
  ],
};

const mockGlobalVariableSet: VariableSet = {
  name: 'api',
  description: 'API configuration',
  defaultValue: 'development',
  activeValue: 'development',
  values: {
    development: {
      url: 'http://localhost:3000',
      timeout: 5000,
      debug: true,
    },
    production: {
      url: 'https://api.example.com',
      timeout: 3000,
      debug: false,
    },
  },
};

describe('CollectionManager', () => {
  let collectionManager: CollectionManagerImpl;
  let mockRequest: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup fs mock
    (fs.readFile as any).mockImplementation((filePath: string) => {
      if (filePath.includes('test-collection')) {
        return Promise.resolve(JSON.stringify(mockCollection));
      }
      return Promise.reject(new Error('File not found'));
    });
    
    // Setup SHCClient mock
    mockRequest = vi.fn().mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      responseTime: 100,
    });
    
    (SHCClient.create as any).mockReturnValue({
      request: mockRequest,
    });
    
    // Create collection manager instance
    collectionManager = new CollectionManagerImpl({
      storagePath: './test-collections',
    });
  });
  
  describe('Collection operations', () => {
    it('should load a collection from a file', async () => {
      const collection = await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      expect(fs.readFile).toHaveBeenCalledWith('./test-collections/test-collection.json', 'utf8');
      expect(collection).toEqual(mockCollection);
    });
    
    it('should save a collection to a file', async () => {
      await collectionManager.saveCollection(mockCollection);
      
      expect(fs.mkdir).toHaveBeenCalledWith('./test-collections', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('./test-collections', 'test-collection.json'),
        JSON.stringify(mockCollection, null, 2),
        'utf8'
      );
    });
    
    it('should create a new collection', async () => {
      const newCollection = await collectionManager.createCollection('new-collection', {
        baseUrl: 'https://api.example.com',
      });
      
      expect(newCollection).toEqual({
        name: 'new-collection',
        version: '1.0.0',
        baseUrl: 'https://api.example.com',
        variableSets: [],
        requests: [],
      });
      
      expect(fs.writeFile).toHaveBeenCalled();
    });
    
    it('should delete a collection', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      await collectionManager.deleteCollection('test-collection');
      
      expect(fs.unlink).toHaveBeenCalledWith(path.join('./test-collections', 'test-collection.json'));
    });
  });
  
  describe('Request management', () => {
    it('should add a request to a collection', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      const newRequest: Request = {
        id: 'new-request',
        name: 'New Request',
        method: 'POST',
        path: '/users',
        body: { name: 'Test User' },
      };
      
      await collectionManager.addRequest('test-collection', newRequest);
      
      // The collection should have been saved with the new request
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Check that the request was added to the collection
      const writeFileCall = (fs.writeFile as any).mock.calls[0];
      const savedCollection = JSON.parse(writeFileCall[1]);
      
      expect(savedCollection.requests).toHaveLength(2);
      expect(savedCollection.requests[1]).toEqual(newRequest);
    });
    
    it('should update a request in a collection', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      const updatedRequest: Request = {
        id: 'get-user-profile',
        name: 'Updated User Profile',
        method: 'GET',
        path: '/users/profile/updated',
        headers: {
          'Accept': 'application/json',
        },
      };
      
      await collectionManager.updateRequest('test-collection', 'get-user-profile', updatedRequest);
      
      // The collection should have been saved with the updated request
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Check that the request was updated in the collection
      const writeFileCall = (fs.writeFile as any).mock.calls[0];
      const savedCollection = JSON.parse(writeFileCall[1]);
      
      expect(savedCollection.requests).toHaveLength(1);
      expect(savedCollection.requests[0]).toEqual(updatedRequest);
    });
    
    it('should delete a request from a collection', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      await collectionManager.deleteRequest('test-collection', 'get-user-profile');
      
      // The collection should have been saved without the deleted request
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Check that the request was deleted from the collection
      const writeFileCall = (fs.writeFile as any).mock.calls[0];
      const savedCollection = JSON.parse(writeFileCall[1]);
      
      expect(savedCollection.requests).toHaveLength(0);
    });
  });
  
  describe('Variable set management', () => {
    it('should add a global variable set', async () => {
      await collectionManager.addGlobalVariableSet(mockGlobalVariableSet);
      
      // Try to get the variable set
      const variableSet = await collectionManager.getGlobalVariableSet('api');
      
      expect(variableSet).toEqual(mockGlobalVariableSet);
    });
    
    it('should update a global variable set', async () => {
      // First add the variable set
      await collectionManager.addGlobalVariableSet(mockGlobalVariableSet);
      
      const updatedVariableSet: VariableSet = {
        ...mockGlobalVariableSet,
        activeValue: 'production',
      };
      
      await collectionManager.updateGlobalVariableSet('api', updatedVariableSet);
      
      // Try to get the updated variable set
      const variableSet = await collectionManager.getGlobalVariableSet('api');
      
      expect(variableSet).toEqual(updatedVariableSet);
    });
    
    it('should set the active value for a global variable set', async () => {
      // First add the variable set
      await collectionManager.addGlobalVariableSet(mockGlobalVariableSet);
      
      await collectionManager.setGlobalVariableSetValue('api', 'production');
      
      // Try to get the updated variable set
      const variableSet = await collectionManager.getGlobalVariableSet('api');
      
      expect(variableSet.activeValue).toEqual('production');
    });
    
    it('should add a variable set to a collection', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      const newVariableSet: VariableSet = {
        name: 'api',
        description: 'API configuration',
        defaultValue: 'development',
        activeValue: 'development',
        values: {
          development: {
            url: 'http://localhost:3000',
          },
          production: {
            url: 'https://api.example.com',
          },
        },
      };
      
      await collectionManager.addVariableSet('test-collection', newVariableSet);
      
      // The collection should have been saved with the new variable set
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Check that the variable set was added to the collection
      const writeFileCall = (fs.writeFile as any).mock.calls[0];
      const savedCollection = JSON.parse(writeFileCall[1]);
      
      expect(savedCollection.variableSets).toHaveLength(2);
      expect(savedCollection.variableSets[1]).toEqual(newVariableSet);
    });
  });
  
  describe('Request execution', () => {
    it('should execute a request with resolved variables', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      await collectionManager.executeRequest('test-collection', 'get-user-profile');
      
      // Check that the request was made with the correct configuration
      expect(mockRequest).toHaveBeenCalledWith({
        url: 'https://api.example.com/users/profile',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': 'johns-api-key',
          'X-User-Email': 'john@example.com',
        },
        query: {
          debug: 'true',
        },
      });
    });
    
    it('should execute a request with variable overrides', async () => {
      // First load the collection to put it in the map
      await collectionManager.loadCollection('./test-collections/test-collection.json');
      
      await collectionManager.executeRequest('test-collection', 'get-user-profile', {
        variableOverrides: {
          'user.apiKey': 'override-api-key',
        },
        timeout: 10000,
      });
      
      // Check that the request was made with the correct configuration
      expect(mockRequest).toHaveBeenCalledWith({
        url: 'https://api.example.com/users/profile',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': 'override-api-key',
          'X-User-Email': 'john@example.com',
        },
        query: {
          debug: 'true',
        },
        timeout: 10000,
      });
    });
  });
});
