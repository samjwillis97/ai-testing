/**
 * Tests for silent mode in the CLI plugin system
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cliPluginManager } from '../../src/plugins/plugin-manager.js';

describe('CLI Plugin Manager Silent Mode', () => {
  let consoleLogSpy: vi.SpyInstance;
  let consoleErrorSpy: vi.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    // Reset silent mode after each test
    cliPluginManager.setSilentMode(false);
  });

  it('should not log messages when silent mode is enabled', () => {
    // Enable silent mode
    cliPluginManager.setSilentMode(true);

    // Register a test formatter
    cliPluginManager.registerOutputFormatter('test-format', (data) => String(data));

    // Verify no logs were produced
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log messages when silent mode is disabled', () => {
    // Disable silent mode
    cliPluginManager.setSilentMode(false);

    // Register a test formatter
    cliPluginManager.registerOutputFormatter('test-format', (data) => String(data));

    // Verify logs were produced
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
