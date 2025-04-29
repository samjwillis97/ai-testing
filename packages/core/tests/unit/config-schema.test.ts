import { describe, it, expect } from 'vitest';
import {
  configSchema,
  validateConfig,
  validatePartialConfig,
  formatValidationErrors,
  safeValidateConfig,
} from '../../src/schemas/config.schema';
import { z } from 'zod';

describe('Config Schema', () => {
  describe('configSchema', () => {
    it('should validate a valid complete configuration', () => {
      const validConfig = {
        name: 'Test Config',
        version: '1.0.0',
        core: {
          http: {
            timeout: 5000,
            max_redirects: 3,
            retry: {
              attempts: 3,
              backoff: 'exponential',
            },
            tls: {
              verify: true,
            },
          },
          logging: {
            level: 'info',
            format: 'text',
            output: 'console',
          },
        },
        variable_sets: {
          global: {
            api_url: 'https://api.example.com',
          },
          collection_defaults: {
            timeout: 3000,
          },
        },
        plugins: {
          auth: [
            {
              name: 'basic-auth',
              enabled: true
            }
          ],
          preprocessors: [
            {
              name: 'request-logger',
              enabled: true
            }
          ],
          transformers: [
            {
              name: 'response-formatter',
              enabled: true
            }
          ],
        },
        storage: {
          collections: {
            type: 'file',
            path: './collections',
          },
        },
      };

      const result = configSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should apply default values for missing properties', () => {
      const minimalConfig = {
        name: 'Minimal Config',
      };

      const result = configSchema.parse(minimalConfig);

      expect(result.name).toBe('Minimal Config');
      expect(result.version).toBe('1.0.0'); // Default
      expect(result.core.http.timeout).toBe(30000); // Default
      expect(result.core.logging.level).toBe('info'); // Default
      expect(result.plugins.auth).toEqual([]); // Default
      expect(result.storage.collections.type).toBe('file'); // Default
    });

    it('should reject invalid values', () => {
      const invalidConfig = {
        name: 'Invalid Config',
        version: 123, // Should be a string
        core: {
          http: {
            timeout: 'invalid', // Should be a number
            retry: {
              attempts: -1, // Should be >= 0
              backoff: 'invalid', // Should be one of the enum values
            },
          },
          logging: {
            level: 'extreme', // Should be one of the enum values
          },
        },
      };

      const result = configSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);

      if (!result.success) {
        // Check for specific error messages
        const errorMap = new Map(
          result.error.errors.map((err) => [err.path.join('.'), err.message])
        );

        expect(errorMap.get('version')).toBeDefined();
        expect(errorMap.get('core.http.timeout')).toBeDefined();
        expect(errorMap.get('core.http.retry.attempts')).toBeDefined();
        expect(errorMap.get('core.http.retry.backoff')).toBeDefined();
        expect(errorMap.get('core.logging.level')).toBeDefined();
      }
    });
  });

  describe('validateConfig', () => {
    it('should validate a complete config and return it with defaults', () => {
      const config = {
        name: 'Test Config',
        version: '1.0.0',
      };

      const validated = validateConfig(config);
      expect(validated.name).toBe('Test Config');
      expect(validated.version).toBe('1.0.0');
      expect(validated.core).toBeDefined();
      expect(validated.plugins).toBeDefined();
    });

    it('should throw for invalid config', () => {
      const invalidConfig = {
        name: 123, // Should be a string
        version: '1.0.0',
      };

      expect(() => validateConfig(invalidConfig)).toThrow();
    });
  });

  describe('validatePartialConfig', () => {
    it('should validate a partial config without requiring all fields', () => {
      const partialConfig = {
        core: {
          http: {
            timeout: 5000,
          },
        },
      };

      const validated = validatePartialConfig(partialConfig);
      expect(validated.core?.http?.timeout).toBe(5000);
    });

    it('should still validate the types of provided fields', () => {
      const invalidPartial = {
        core: {
          http: {
            timeout: 'invalid', // Should be a number
          },
        },
      };

      expect(() => validatePartialConfig(invalidPartial)).toThrow();
    });
  });

  describe('safeValidateConfig', () => {
    it('should return success and data for valid config', () => {
      const config = {
        name: 'Test Config',
        version: '1.0.0',
      };

      const result = safeValidateConfig(config);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Test Config');
    });

    it('should return error information for invalid config', () => {
      const invalidConfig = {
        name: 123, // Should be a string
        version: '1.0.0',
      };

      const result = safeValidateConfig(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(z.ZodError);
      expect(result.data).toBeUndefined();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format Zod errors into readable messages', () => {
      const invalidConfig = {
        name: 123, // Should be a string
        core: {
          http: {
            timeout: 'invalid', // Should be a number
          },
        },
      };

      const result = configSchema.safeParse(invalidConfig);

      if (!result.success) {
        const formatted = formatValidationErrors(result.error);
        expect(formatted).toContain('name:');
        expect(formatted).toContain('core.http.timeout:');
      } else {
        // Use expect to fail the test if validation unexpectedly succeeds
        expect(false).toBe(true);
      }
    });
  });
});
