/**
 * Tests for quiet mode in the CLI plugin system
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cliPluginManager } from '../../src/plugins/plugin-manager.js';

describe('CLI Plugin Manager Quiet Mode', () => {
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Reset quiet mode after each test
    cliPluginManager.setQuietMode(false);
  });

  it('should not log messages when quiet mode is enabled', () => {
    // Enable quiet mode
    cliPluginManager.setQuietMode(true);

    // Register a test formatter
    cliPluginManager.registerOutputFormatter('test-format', (data) => String(data));

    // Verify no logs were produced
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
