/**
 * Tests for markdown-formatter example plugin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import markdownFormatterPlugin from '../../../src/plugins/examples/markdown-formatter';
import { CLIPluginContext } from '../../../src/types/cli-plugin.types';

describe('Markdown Formatter Plugin', () => {
  // Mock plugin context
  let mockContext: CLIPluginContext;

  beforeEach(() => {
    // Create a mock context
    mockContext = {
      registerOutputFormatter: vi.fn(),
      log: vi.fn(),
      logError: vi.fn(),
    } as unknown as CLIPluginContext;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should register the markdown formatter', () => {
    // Register the plugin
    markdownFormatterPlugin.register(mockContext);

    // Verify that the formatter was registered
    expect(mockContext.registerOutputFormatter).toHaveBeenCalledWith(
      'markdown',
      expect.any(Function)
    );
  });

  it('should format JSON response as markdown', () => {
    // Register the plugin
    markdownFormatterPlugin.register(mockContext);

    // Get the formatter function
    const formatter = (mockContext.registerOutputFormatter as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][1];

    // Sample response data - an array of objects for table formatting
    const responseData = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ];

    // Call the formatter
    const result = formatter(responseData);

    // Verify that the response was formatted as markdown table
    expect(typeof result).toBe('string');
    expect(result).toContain('| id | name |');
    expect(result).toContain('| --- | --- |');
    expect(result).toContain('| 1 | John |');
    expect(result).toContain('| 2 | Jane |');
  });

  it('should handle non-object response', () => {
    // Register the plugin
    markdownFormatterPlugin.register(mockContext);

    // Get the formatter function
    const formatter = (mockContext.registerOutputFormatter as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][1];

    // Call the formatter with a string
    const result = formatter('Not an object');

    // Verify that the response was formatted as JSON string
    expect(typeof result).toBe('string');
    expect(result).toBe('"Not an object"');
  });

  it('should handle array response', () => {
    // Register the plugin
    markdownFormatterPlugin.register(mockContext);

    // Get the formatter function
    const formatter = (mockContext.registerOutputFormatter as unknown as ReturnType<typeof vi.fn>)
      .mock.calls[0][1];

    // Call the formatter with a simple array (not array of objects)
    const result = formatter([1, 2, 3]);

    // Verify that the response was formatted as JSON string
    expect(typeof result).toBe('string');
    expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
  });
});
