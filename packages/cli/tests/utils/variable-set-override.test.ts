import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseVariableSetOverrides, applyVariableSetOverrides } from '../../src/utils/config.js';
import { ConfigManager } from '@shc/core';

// Mock ConfigManager
vi.mock('@shc/core', () => {
  return {
    ConfigManager: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
    })),
  };
});

describe('Variable Set Override Functions', () => {
  describe('parseVariableSetOverrides', () => {
    it('should parse valid variable set overrides', () => {
      const overrides = ['api=production', 'resource=test-data'];
      const result = parseVariableSetOverrides(overrides);
      expect(result).toEqual({
        api: 'production',
        resource: 'test-data',
      });
    });

    it('should handle empty array', () => {
      const result = parseVariableSetOverrides([]);
      expect(result).toEqual({});
    });

    it('should skip invalid formats and log error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const overrides = ['api=production', 'invalid-format', 'resource=test-data'];
      const result = parseVariableSetOverrides(overrides);
      expect(result).toEqual({
        api: 'production',
        resource: 'test-data',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid variable set override format: invalid-format. Expected format: namespace=value'
      );
      consoleSpy.mockRestore();
    });

    it('should trim whitespace from namespace and value', () => {
      const overrides = [' api = production ', ' resource = test-data '];
      const result = parseVariableSetOverrides(overrides);
      expect(result).toEqual({
        api: 'production',
        resource: 'test-data',
      });
    });
  });

  describe('applyVariableSetOverrides', () => {
    let configManager: ConfigManager;
    let consoleSpy: any;

    beforeEach(() => {
      configManager = new ConfigManager();
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      consoleSpy.log.mockRestore();
      consoleSpy.warn.mockRestore();
    });

    it('should apply variable set overrides to existing variable sets', () => {
      // Mock the ConfigManager.get method to return variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
        resource: { active_value: 'default' },
      });

      const overrides = {
        api: 'production',
        resource: 'test-data',
      };

      applyVariableSetOverrides(configManager, overrides);

      // Check that set was called with the correct parameters
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.api.active_value',
        'production'
      );
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.resource.active_value',
        'test-data'
      );

      // Check that log was called for each override
      expect(consoleSpy.log).toHaveBeenCalledWith('Variable set override applied: api=production');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Variable set override applied: resource=test-data'
      );
    });

    it('should warn about non-existent variable sets', () => {
      // Mock the ConfigManager.get method to return variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
      });

      const overrides = {
        api: 'production',
        nonexistent: 'value',
      };

      applyVariableSetOverrides(configManager, overrides);

      // Check that set was called only for the existing variable set
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.api.active_value',
        'production'
      );
      expect(configManager.set).not.toHaveBeenCalledWith(
        'variable_sets.global.nonexistent.active_value',
        'value'
      );

      // Check that log and warn were called appropriately
      expect(consoleSpy.log).toHaveBeenCalledWith('Variable set override applied: api=production');
      expect(consoleSpy.warn).toHaveBeenCalledWith('Variable set not found: nonexistent');
    });

    it('should handle empty overrides object', () => {
      applyVariableSetOverrides(configManager, {});
      expect(configManager.set).not.toHaveBeenCalled();
    });

    it('should handle null or undefined variable sets', () => {
      // Mock the ConfigManager.get method to return null
      (configManager.get as any).mockReturnValue(null);

      const overrides = {
        api: 'production',
      };

      applyVariableSetOverrides(configManager, overrides);

      // Check that warn was called for the non-existent variable set
      expect(consoleSpy.warn).toHaveBeenCalledWith('Variable set not found: api');
      expect(configManager.set).not.toHaveBeenCalled();
    });
  });
});
