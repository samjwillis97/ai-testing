import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseVariableSetOverrides, applyVariableSetOverrides } from '../../src/utils/config.js';
import { ConfigManager } from '@shc/core';

// Mock the logger module
vi.mock('../../src/utils/logger.js', () => {
  const mockInfo = vi.fn();
  const mockError = vi.fn();
  const mockWarn = vi.fn();
  const mockDebug = vi.fn();

  return {
    globalLogger: {
      info: mockInfo,
      error: mockError,
      warn: mockWarn,
      debug: mockDebug,
    },
    LogLevel: {
      DEBUG: 'debug',
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      SILENT: 'silent',
    },
  };
});

// Import the mocked logger
import { globalLogger } from '../../src/utils/logger.js';

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
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

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
      const overrides = ['api=production', 'invalid-format', 'resource=test-data'];
      const result = parseVariableSetOverrides(overrides);
      expect(result).toEqual({
        api: 'production',
        resource: 'test-data',
      });
      expect(globalLogger.error).toHaveBeenCalledWith(
        'Invalid variable set override format: invalid-format. Expected format: namespace=value'
      );
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

    beforeEach(() => {
      configManager = new ConfigManager();

      // Mock the ConfigManager.get method to return variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
        resource: { active_value: 'default' },
      });
    });

    it('should apply variable set overrides to request-specific context', () => {
      const overrides = {
        api: 'production',
        resource: 'test-data',
      };

      // Pass true for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, true);

      // Check that set was called for each override with request-specific format
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
        active_value: 'production',
        values: {
          production: 'production',
        },
      });
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.resource', {
        active_value: 'test-data',
        values: {
          'test-data': 'test-data',
        },
      });

      // Check that log was called for each override
      expect(globalLogger.info).toHaveBeenCalledWith(
        'Request-specific variable set override applied: api=production'
      );
      expect(globalLogger.info).toHaveBeenCalledWith(
        'Request-specific variable set override applied: resource=test-data'
      );
    });

    it('should apply variable set overrides to global context', () => {
      const overrides = {
        api: 'production',
        resource: 'test-data',
      };

      // Pass false for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, false);

      // Check that set was called for each override with global format
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.api.active_value',
        'production'
      );
      expect(configManager.set).toHaveBeenCalledWith(
        'variable_sets.global.resource.active_value',
        'test-data'
      );

      // Check that log was called for each override
      expect(globalLogger.info).toHaveBeenCalledWith(
        'Variable set override applied: api=production'
      );
      expect(globalLogger.info).toHaveBeenCalledWith(
        'Variable set override applied: resource=test-data'
      );
    });

    it('should warn about non-existent variable sets', () => {
      // Reset the mock to return a partial set of variable sets
      (configManager.get as any).mockReturnValue({
        api: { active_value: 'development' },
      });

      const overrides = {
        api: 'production',
        nonexistent: 'value',
      };

      // Pass true for requestSpecific parameter
      applyVariableSetOverrides(configManager, overrides, true);

      // Check that set was called only for the existing variable set
      expect(configManager.set).toHaveBeenCalledWith('variable_sets.request_overrides.api', {
        active_value: 'production',
        values: {
          production: 'production',
        },
      });

      // Check that set was not called for the non-existent variable set
      expect(configManager.set).not.toHaveBeenCalledWith(
        expect.stringContaining('nonexistent'),
        expect.anything()
      );

      // Check that warn was called for non-existent variable set
      expect(globalLogger.warn).toHaveBeenCalledWith('Variable set not found: nonexistent');
    });

    it('should handle null variable sets', () => {
      // Mock the ConfigManager.get method to return null
      (configManager.get as any).mockReturnValue(null);

      const overrides = {
        api: 'production',
      };

      applyVariableSetOverrides(configManager, overrides);

      // Check that warn was called for non-existent variable set
      expect(globalLogger.warn).toHaveBeenCalledWith('Variable set not found: api');
      expect(configManager.set).not.toHaveBeenCalled();
    });
  });
});
