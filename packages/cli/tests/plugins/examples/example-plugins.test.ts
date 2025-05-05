/**
 * Tests for Example Plugins
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CLIPluginContext,
  CommandHandler,
  OutputFormatter,
  ResponseVisualizer,
  CompletionHandler,
} from '../../../src/types/cli-plugin.types.js';
import { loadExamplePlugins } from '../../../src/plugins/examples/index.js';
import markdownFormatterPlugin from '../../../src/plugins/examples/markdown-formatter.js';
import helpCommandPlugin from '../../../src/plugins/examples/help-command.js';
import jsonVisualizerPlugin from '../../../src/plugins/examples/json-visualizer.js';
import bashCompletionPlugin from '../../../src/plugins/examples/bash-completion.js';

// Spy on the plugin register methods
vi.spyOn(markdownFormatterPlugin, 'register');
vi.spyOn(helpCommandPlugin, 'register');
vi.spyOn(jsonVisualizerPlugin, 'register');
vi.spyOn(bashCompletionPlugin, 'register');

describe('Example Plugins', () => {
  // Mock plugin context
  const mockContext: CLIPluginContext = {
    registerOutputFormatter: vi.fn(),
    registerCommand: vi.fn(),
    registerShellCompletion: vi.fn(),
    registerResponseVisualizer: vi.fn(),
    silent: false,
  };

  // Mock console.log
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Mock console.log
    console.log = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  describe('Plugin Loader', () => {
    it('should load all example plugins', () => {
      // Load example plugins
      loadExamplePlugins(mockContext);

      // Verify that each plugin's register method was called
      expect(markdownFormatterPlugin.register).toHaveBeenCalledWith(mockContext);
      expect(helpCommandPlugin.register).toHaveBeenCalledWith(mockContext);
      expect(jsonVisualizerPlugin.register).toHaveBeenCalledWith(mockContext);
      expect(bashCompletionPlugin.register).toHaveBeenCalledWith(mockContext);
    });

    it('should handle plugin registration errors', () => {
      // Make one plugin throw an error during registration
      vi.spyOn(helpCommandPlugin, 'register').mockImplementationOnce(() => {
        throw new Error('Registration error');
      });

      // Load example plugins
      loadExamplePlugins(mockContext);

      // Verify that other plugins were still registered
      expect(markdownFormatterPlugin.register).toHaveBeenCalledWith(mockContext);
      expect(jsonVisualizerPlugin.register).toHaveBeenCalledWith(mockContext);
      expect(bashCompletionPlugin.register).toHaveBeenCalledWith(mockContext);
    });
  });

  describe('Plugin Registration', () => {
    it('should test plugin registration functions', () => {
      // Create a mock context with spy functions
      const context: CLIPluginContext = {
        registerOutputFormatter: vi.fn(),
        registerCommand: vi.fn(),
        registerShellCompletion: vi.fn(),
        registerResponseVisualizer: vi.fn(),
        silent: false,
      };

      // Register the actual plugins
      markdownFormatterPlugin.register(context);
      helpCommandPlugin.register(context);
      jsonVisualizerPlugin.register(context);
      bashCompletionPlugin.register(context);

      // Verify that the registration functions were called
      expect(context.registerOutputFormatter).toHaveBeenCalledWith(
        'markdown',
        expect.any(Function)
      );
      expect(context.registerCommand).toHaveBeenCalledWith('help-more', expect.any(Function));
      expect(context.registerResponseVisualizer).toHaveBeenCalledWith('json', expect.any(Function));
      expect(context.registerShellCompletion).toHaveBeenCalledWith('bash', expect.any(Function));

      // Test the formatter function if needed
      // This would depend on the actual implementation of the plugins
      // For now, we'll just verify that the registration functions were called
    });
  });
});
