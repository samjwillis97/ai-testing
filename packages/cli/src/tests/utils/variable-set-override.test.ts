import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseVariableSetOverrides, applyVariableSetOverrides } from '../../utils/config';
import { ConfigManager } from '@shc/core';

// Mock ConfigManager
vi.mock('@shc/core', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    get: vi.fn((path, defaultValue) => {
      if (path === 'variable_sets.global') {
        return {
          api: {
            active_value: 'development',
            values: {
              development: 'https://dev-api.example.com',
              staging: 'https://staging-api.example.com',
              production: 'https://api.example.com',
            },
          },
          env: {
            active_value: 'test',
            values: {
              test: 'test-environment',
              prod: 'production-environment',
            },
          },
        };
      }
      return defaultValue;
    }),
    set: vi.fn(),
  })),
}));

describe('Variable Set Override Functionality', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();
    configManager = new ConfigManager();
  });

  describe('parseVariableSetOverrides', () => {
    it('should parse variable set overrides correctly', () => {
      const overrides = ['api=production', 'env=prod'];
      const result = parseVariableSetOverrides(overrides);

      expect(result).toEqual({
        api: 'production',
        env: 'prod',
      });
    });

    it('should handle empty overrides', () => {
      const overrides: string[] = [];
      const result = parseVariableSetOverrides(overrides);

      expect(result).toEqual({});
    });

    it('should handle invalid override format', () => {
      const overrides = ['invalid-format'];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = parseVariableSetOverrides(overrides);

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid variable set override format')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('applyVariableSetOverrides', () => {
    it('should apply global variable set overrides', () => {
      const overrides = { api: 'production', env: 'prod' };

      applyVariableSetOverrides(configManager, overrides, false);

      expect(configManager.set).toHaveBeenCalledTimes(2);
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.api.active_value',
        'production'
      );
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.env.active_value',
        'prod'
      );
    });

    it('should apply request-specific variable set overrides', () => {
      const overrides = { api: 'production', env: 'prod' };

      applyVariableSetOverrides(configManager, overrides, true);

      expect(configManager.set).toHaveBeenCalledTimes(2);
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
        active_value: 'production',
        values: {
          production: 'production',
        },
      });
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.env', {
        active_value: 'prod',
        values: {
          prod: 'prod',
        },
      });
    });

    it('should warn about non-existent variable sets', () => {
      const overrides = { nonexistent: 'value' };
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      applyVariableSetOverrides(configManager, overrides, true);

      expect(configManager.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Variable set not found'));

      consoleSpy.mockRestore();
    });
  });
});
