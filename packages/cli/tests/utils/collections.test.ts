/**
 * Tests for collections utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { getCollections, getRequests, getRequest } from '../../src/utils/collections.js';

// Mock fs module
vi.mock('fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  mkdir: vi.fn().mockResolvedValue(undefined),
}));

describe('Collections Utility', () => {
  // Test directory paths
  const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-collections-test');
  const COLLECTION_DIR = path.join(TEST_DIR, 'collections');

  // Sample collection data
  const SAMPLE_COLLECTION_YAML = `
requests:
  get-users:
    name: Get Users
    description: Get all users
    method: GET
    url: https://api.example.com/users
    headers:
      Content-Type: application/json
      Authorization: Bearer token123
  create-user:
    name: Create User
    description: Create a new user
    method: POST
    url: https://api.example.com/users
    body:
      name: John Doe
      email: john@example.com
  `;

  const SAMPLE_COLLECTION_JSON = JSON.stringify({
    requests: {
      'get-user': {
        name: 'Get User',
        description: 'Get a specific user',
        method: 'GET',
        url: 'https://api.example.com/users/123',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
      },
      'update-user': {
        name: 'Update User',
        description: 'Update an existing user',
        method: 'PUT',
        url: 'https://api.example.com/users/123',
        body: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
    },
  });

  // Sample array-based collection
  const SAMPLE_ARRAY_COLLECTION = JSON.stringify({
    requests: [
      {
        id: 'get-users-array',
        name: 'Get Users Array',
        description: 'Get all users (array-based)',
        method: 'GET',
        url: 'https://api.example.com/users',
      },
      {
        id: 'create-user-array',
        name: 'Create User Array',
        description: 'Create a new user (array-based)',
        method: 'POST',
        url: 'https://api.example.com/users',
        body: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    ],
  });

  // Sample collection with baseUrl (camelCase)
  const SAMPLE_COLLECTION_WITH_BASE_URL = JSON.stringify({
    baseUrl: 'https://api.example.com',
    requests: {
      'get-user-with-base': {
        name: 'Get User With Base',
        description: 'Get a specific user with base URL',
        method: 'GET',
        url: '/users/123',
      },
    },
  });

  // Sample collection with base_url (snake_case)
  const SAMPLE_COLLECTION_WITH_SNAKE_BASE_URL = JSON.stringify({
    base_url: 'https://api.example.com',
    requests: {
      'get-user-with-snake-base': {
        name: 'Get User With Snake Base',
        description: 'Get a specific user with snake_case base URL',
        method: 'GET',
        url: '/users/123',
      },
    },
  });

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
  });

  describe('getCollections', () => {
    it('should return a list of collections', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue([
        'collection1.yaml',
        'collection2.json',
        'collection3.yml',
        'not-a-collection.txt',
        'another-file.md',
      ] as any);

      // Call the function
      const collections = await getCollections(COLLECTION_DIR);

      // Verify the result
      expect(collections).toEqual(['collection1', 'collection2', 'collection3']);
      expect(fs.readdir).toHaveBeenCalledWith(COLLECTION_DIR);
    });

    it('should handle empty collections directory', async () => {
      // Mock fs.readdir to return an empty array
      vi.mocked(fs.readdir).mockResolvedValue([] as any);

      // Call the function
      const collections = await getCollections(COLLECTION_DIR);

      // Verify the result
      expect(collections).toEqual([]);
      expect(fs.readdir).toHaveBeenCalledWith(COLLECTION_DIR);
    });

    it('should throw an error if reading the directory fails', async () => {
      // Mock fs.readdir to throw an error
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'));

      // Call the function and expect it to throw
      await expect(getCollections(COLLECTION_DIR)).rejects.toThrow(
        'Failed to read collections directory'
      );
      expect(fs.readdir).toHaveBeenCalledWith(COLLECTION_DIR);
    });
  });

  describe('getRequests', () => {
    it('should return a list of requests from a YAML collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection1.yaml'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_YAML as any);

      // Call the function
      const requests = await getRequests(COLLECTION_DIR, 'collection1');

      // Verify the result
      expect(requests).toHaveLength(2);
      expect(requests[0]).toEqual({
        id: 'get-users',
        name: 'Get Users',
        description: 'Get all users',
        method: 'GET',
      });
      expect(requests[1]).toEqual({
        id: 'create-user',
        name: 'Create User',
        description: 'Create a new user',
        method: 'POST',
      });
    });

    it('should return a list of requests from a JSON collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection2.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_JSON as any);

      // Call the function
      const requests = await getRequests(COLLECTION_DIR, 'collection2');

      // Verify the result
      expect(requests).toHaveLength(2);
      expect(requests[0]).toEqual({
        id: 'get-user',
        name: 'Get User',
        description: 'Get a specific user',
        method: 'GET',
      });
      expect(requests[1]).toEqual({
        id: 'update-user',
        name: 'Update User',
        description: 'Update an existing user',
        method: 'PUT',
      });
    });

    it('should return a list of requests from an array-based collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['array-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample array collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_ARRAY_COLLECTION as any);

      // Call the function
      const requests = await getRequests(COLLECTION_DIR, 'array-collection');

      // Verify the result
      expect(requests).toHaveLength(2);
      expect(requests[0]).toEqual({
        id: 'get-users-array',
        name: 'Get Users Array',
        description: 'Get all users (array-based)',
        method: 'GET',
      });
      expect(requests[1]).toEqual({
        id: 'create-user-array',
        name: 'Create User Array',
        description: 'Create a new user (array-based)',
        method: 'POST',
      });
    });

    it('should throw an error if collection is not found', async () => {
      // Mock fs.readdir to return an empty array
      vi.mocked(fs.readdir).mockResolvedValue([] as any);

      // Call the function and expect it to throw
      await expect(getRequests(COLLECTION_DIR, 'non-existent')).rejects.toThrow(
        "Failed to read requests: Collection 'non-existent' not found"
      );
    });

    it('should throw an error if reading the collection fails', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection1.yaml'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to throw an error
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      // Call the function and expect it to throw
      await expect(getRequests(COLLECTION_DIR, 'collection1')).rejects.toThrow(
        'Failed to load collection'
      );
    });

    it('should handle empty collections with no requests property', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['empty-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return an empty collection
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({}) as any);

      // Call the function
      const requests = await getRequests(COLLECTION_DIR, 'empty-collection');

      // Verify the result is an empty array
      expect(requests).toEqual([]);
    });
  });

  describe('getRequest', () => {
    it('should return a specific request from a collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection1.yaml'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_YAML as any);

      // Call the function
      const request = await getRequest(COLLECTION_DIR, 'collection1', 'get-users');

      // Verify the result
      expect(request).toEqual({
        name: 'Get Users',
        description: 'Get all users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
      });
    });

    it('should return a specific request from an array-based collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['array-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample array collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_ARRAY_COLLECTION as any);

      // Call the function
      const request = await getRequest(COLLECTION_DIR, 'array-collection', 'get-users-array');

      // Verify the result
      expect(request).toEqual({
        id: 'get-users-array',
        name: 'Get Users Array',
        description: 'Get all users (array-based)',
        method: 'GET',
        url: 'https://api.example.com/users',
      });
    });

    it('should apply camelCase baseUrl from collection to request', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['base-url-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection with baseUrl
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_WITH_BASE_URL as any);

      // Call the function
      const request = await getRequest(COLLECTION_DIR, 'base-url-collection', 'get-user-with-base');

      // Verify the result
      expect(request).toEqual({
        name: 'Get User With Base',
        description: 'Get a specific user with base URL',
        method: 'GET',
        url: '/users/123',
        baseUrl: 'https://api.example.com',
      });
    });

    it('should apply snake_case base_url from collection to request', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['snake-base-url-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection with snake_case base_url
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_WITH_SNAKE_BASE_URL as any);

      // Call the function
      const request = await getRequest(
        COLLECTION_DIR,
        'snake-base-url-collection',
        'get-user-with-snake-base'
      );

      // Verify the result
      expect(request).toEqual({
        name: 'Get User With Snake Base',
        description: 'Get a specific user with snake_case base URL',
        method: 'GET',
        url: '/users/123',
        baseUrl: 'https://api.example.com',
      });
    });

    it('should not override existing baseUrl in request', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['base-url-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Create a sample collection with baseUrl and a request that already has baseUrl
      const collectionWithRequestBaseUrl = JSON.stringify({
        baseUrl: 'https://api.example.com',
        requests: {
          'get-user-with-own-base': {
            name: 'Get User With Own Base',
            description: 'Get a specific user with its own baseUrl',
            method: 'GET',
            url: '/users/123',
            baseUrl: 'https://api.other.com',
          },
        },
      });

      // Mock fs.readFile to return the sample collection
      vi.mocked(fs.readFile).mockResolvedValue(collectionWithRequestBaseUrl as any);

      // Call the function
      const request = await getRequest(
        COLLECTION_DIR,
        'base-url-collection',
        'get-user-with-own-base'
      );

      // Verify that the request's own baseUrl is preserved
      expect(request).toEqual({
        name: 'Get User With Own Base',
        description: 'Get a specific user with its own baseUrl',
        method: 'GET',
        url: '/users/123',
        baseUrl: 'https://api.other.com',
      });
    });

    it('should throw an error if request is not found in collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection1.yaml'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return sample collection content
      vi.mocked(fs.readFile).mockResolvedValue(SAMPLE_COLLECTION_YAML as any);

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'collection1', 'non-existent')).rejects.toThrow(
        "Failed to get request: Request 'non-existent' not found in collection 'collection1'"
      );
    });

    it('should throw an error for unsupported file format in content', async () => {
      // Mock fs.readdir to return a list of files including a supported extension
      vi.mocked(fs.readdir).mockResolvedValue(['collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return invalid JSON content that will cause a parse error
      vi.mocked(fs.readFile).mockResolvedValue('This is not valid JSON' as any);

      // Call the function and expect it to throw with the correct error message structure
      await expect(getRequest(COLLECTION_DIR, 'collection', 'get-users')).rejects.toThrow(
        'Failed to get request: Failed to load collection:'
      );
    });

    it('should handle null requests object in collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['invalid-collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Create an invalid collection with null requests
      const invalidCollection = JSON.stringify({
        requests: null,
      });

      // Mock fs.readFile to return the invalid collection
      vi.mocked(fs.readFile).mockResolvedValue(invalidCollection as any);

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'invalid-collection', 'get-users')).rejects.toThrow(
        "Failed to get request: Request 'get-users' not found in collection 'invalid-collection'"
      );
    });

    it('should throw an error when finding collection file fails', async () => {
      // Mock fs.readdir to throw an error
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Permission denied'));

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'collection1', 'get-users')).rejects.toThrow(
        'Failed to get request: Failed to find collection: Permission denied'
      );
    });

    it('should handle YAML parsing errors', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection.yaml'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return invalid YAML content
      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml: content: -' as any);

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'collection', 'get-users')).rejects.toThrow(
        'Failed to get request: Failed to load collection:'
      );
    });

    it('should handle missing requests property in collection', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to return a collection without requests property
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify({
          name: 'Collection without requests',
        }) as any
      );

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'collection', 'get-users')).rejects.toThrow(
        "Failed to get request: Request 'get-users' not found in collection 'collection'"
      );
    });

    it('should handle non-Error objects in error handling', async () => {
      // Mock fs.readdir to return a list of files
      vi.mocked(fs.readdir).mockResolvedValue(['collection.json'] as any);

      // Mock fs.stat to indicate it's a file
      vi.mocked(fs.stat).mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      } as any);

      // Mock fs.readFile to throw a non-Error object
      vi.mocked(fs.readFile).mockImplementation(() => {
        throw 'Not an Error object';
      });

      // Call the function and expect it to throw
      await expect(getRequest(COLLECTION_DIR, 'collection', 'get-users')).rejects.toThrow(
        'Failed to get request: Failed to load collection: Not an Error object'
      );
    });
  });
});
