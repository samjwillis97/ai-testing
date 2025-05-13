import { describe, it, expect } from 'vitest';
import { configSchema } from '../../src/schemas/config.schema';

describe('Config Schema Validation', () => {
  describe('Basic validation', () => {
    it('should validate a minimal valid configuration', () => {
      const minimalConfig = {
        name: 'Test Config',
        version: '1.0.0',
      };

      const result = configSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });

    it('should validate a complete valid configuration', () => {
      const completeConfig = {
        name: 'Complete Config',
        version: '1.0.0',
        core: {
          http: {
            timeout: 5000,
            max_redirects: 5,
            retry: {
              attempts: 3,
              backoff: 'exponential'
            }
          },
          logging: {
            level: 'info',
            format: 'text'
          }
        },
        storage: {
          collections: {
            type: 'file',
            path: '/path/to/collections',
          },
        },
        plugins: {
          auth: [
            {
              name: 'test-auth-plugin',
              package: '@test/auth-plugin',
              version: '1.0.0',
              enabled: true,
              config: {
                option1: 'value1',
              },
            }
          ],
          preprocessors: [
            {
              name: 'test-preprocessor',
              package: '@test/preprocessor',
              version: '1.0.0',
            }
          ],
          transformers: []
        },
        cli: {
          defaultFormat: 'json',
          autoComplete: true,
        },
      };

      const result = configSchema.safeParse(completeConfig);
      expect(result.success).toBe(true);
    });
  });

  describe('Required fields', () => {
    it('should provide default for name field if missing', () => {
      const missingName = {
        version: '1.0.0',
      };

      const result = configSchema.safeParse(missingName);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBeDefined();
      }
    });

    it('should provide default for version field if missing', () => {
      const missingVersion = {
        name: 'Test Config',
      };

      const result = configSchema.safeParse(missingVersion);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBeDefined();
      }
    });
  });

  describe('Type validation', () => {
    it('should validate core.http.timeout as number', () => {
      const invalidTimeout = {
        name: 'Test Config',
        version: '1.0.0',
        core: {
          http: {
            timeout: 'not-a-number',
          },
        },
      };

      const result = configSchema.safeParse(invalidTimeout);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.join('.') === 'core.http.timeout'
        );
        expect(issue).toBeDefined();
        expect(issue?.code).toBe('invalid_type');
      }
    });

    it('should validate core.http.max_redirects as number', () => {
      const invalidMaxRedirects = {
        name: 'Test Config',
        version: '1.0.0',
        core: {
          http: {
            max_redirects: 'not-a-number',
          },
        },
      };

      const result = configSchema.safeParse(invalidMaxRedirects);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.join('.') === 'core.http.max_redirects'
        );
        expect(issue).toBeDefined();
        expect(issue?.code).toBe('invalid_type');
      }
    });

    it('should validate storage.collections.type as enum', () => {
      const invalidStorageType = {
        name: 'Test Config',
        version: '1.0.0',
        storage: {
          collections: {
            type: 'invalid-type',
            path: '/path/to/collections',
          },
        },
      };

      const result = configSchema.safeParse(invalidStorageType);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(issue => 
          issue.path.join('.') === 'storage.collections.type'
        );
        expect(issue).toBeDefined();
      }
    });
  });
});
