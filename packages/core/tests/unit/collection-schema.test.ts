import { describe, it, expect } from 'vitest';
import { CollectionSchemas, validateCollection, safeValidateCollection } from '../../src/schemas/collection.schema';

describe('Collection Schema Validation', () => {
  describe('Basic validation', () => {
    it('should validate a minimal valid collection', () => {
      const minimalCollection = {
        name: 'Test Collection',
        version: '1.0.0',
      };

      const result = CollectionSchemas.collection.safeParse(minimalCollection);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Collection');
        expect(result.data.version).toBe('1.0.0');
        expect(result.data.requests).toEqual([]);
        expect(result.data.variableSets).toEqual([]);
      }
    });

    it('should validate a complete collection', () => {
      const completeCollection = {
        name: 'Complete Collection',
        version: '2.0.0',
        baseUrl: 'https://api.example.com',
        authentication: {
          type: 'bearer',
          name: 'Bearer Auth',
          config: {
            token: 'abc123',
          },
        },
        requests: [
          {
            id: 'req1',
            name: 'Get Users',
            method: 'GET',
            path: '/users',
            headers: {
              'Content-Type': 'application/json',
            },
            query: {
              limit: '10',
            },
          },
        ],
        variableSets: [
          {
            name: 'Environment',
            activeValue: 'dev',
            values: {
              dev: {
                apiUrl: 'https://dev.api.example.com',
              },
              prod: {
                apiUrl: 'https://api.example.com',
              },
            },
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(completeCollection);
      expect(result.success).toBe(true);
    });

    it('should require name field', () => {
      const missingName = {
        version: '1.0.0',
      };

      const result = CollectionSchemas.collection.safeParse(missingName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name');
      }
    });

    it('should require version field', () => {
      const missingVersion = {
        name: 'Test Collection',
      };

      const result = CollectionSchemas.collection.safeParse(missingVersion);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('version');
      }
    });
  });

  describe('Request validation', () => {
    it('should validate request id as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        requests: [
          {
            // Missing id
            name: 'Get Users',
            method: 'GET',
            path: '/users',
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('requests') && issue.path.includes('id')
        );
        expect(issue).toBeDefined();
      }
    });

    it('should validate request name as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        requests: [
          {
            id: 'req1',
            // Missing name
            method: 'GET',
            path: '/users',
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('requests') && issue.path.includes('name')
        );
        expect(issue).toBeDefined();
      }
    });

    it('should validate request method as required and enum', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        requests: [
          {
            id: 'req1',
            name: 'Get Users',
            method: 'INVALID_METHOD',
            path: '/users',
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('requests') && issue.path.includes('method')
        );
        expect(issue).toBeDefined();
        expect(issue?.code).toBe('invalid_enum_value');
      }
    });

    it('should validate request path as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        requests: [
          {
            id: 'req1',
            name: 'Get Users',
            method: 'GET',
            // Missing path
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('requests') && issue.path.includes('path')
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Variable set validation', () => {
    it('should validate variable set name as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        variableSets: [
          {
            // Missing name
            activeValue: 'dev',
            values: {
              dev: {
                apiUrl: 'https://dev.api.example.com',
              },
            },
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('variableSets') && issue.path.includes('name')
        );
        expect(issue).toBeDefined();
      }
    });

    it('should validate variable set activeValue as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        variableSets: [
          {
            name: 'Environment',
            // Missing activeValue
            values: {
              dev: {
                apiUrl: 'https://dev.api.example.com',
              },
            },
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('variableSets') && issue.path.includes('activeValue')
        );
        expect(issue).toBeDefined();
      }
    });

    it('should validate variable set values as required', () => {
      const collection = {
        name: 'Test Collection',
        version: '1.0.0',
        variableSets: [
          {
            name: 'Environment',
            activeValue: 'dev',
            // Missing values
          },
        ],
      };

      const result = CollectionSchemas.collection.safeParse(collection);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.includes('variableSets') && issue.path.includes('values')
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Helper functions', () => {
    it('should validate a collection using validateCollection', async () => {
      const validCollection = {
        name: 'Test Collection',
        version: '1.0.0',
      };

      const result = await validateCollection(validCollection);
      expect(result.name).toBe('Test Collection');
      expect(result.version).toBe('1.0.0');
      expect(result.requests).toEqual([]);
      expect(result.variableSets).toEqual([]);
    });

    it('should safely validate a collection using safeValidateCollection', async () => {
      const validCollection = {
        name: 'Test Collection',
        version: '1.0.0',
      };

      const result = await safeValidateCollection(validCollection);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      if (result.data) {
        expect(result.data.name).toBe('Test Collection');
        expect(result.data.version).toBe('1.0.0');
      }
    });

    it('should handle validation errors in safeValidateCollection', async () => {
      const invalidCollection = {
        // Missing required fields
        name: 'Test Collection',
      };

      const result = await safeValidateCollection(invalidCollection);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });
});
