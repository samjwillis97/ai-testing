/**
 * Tests for json-visualizer example plugin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jsonVisualizerPlugin from '../../../src/plugins/examples/json-visualizer';
import { CLIPluginContext } from '../../../src/types/cli-plugin.types';
import chalk from 'chalk';

describe('JSON Visualizer Plugin', () => {
  // Mock plugin context
  let mockContext: CLIPluginContext;

  beforeEach(() => {
    // Create a mock context
    mockContext = {
      registerResponseVisualizer: vi.fn(),
      log: vi.fn(),
      logError: vi.fn(),
    } as unknown as CLIPluginContext;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should register the JSON visualizer', () => {
    // Register the plugin
    jsonVisualizerPlugin.register(mockContext);

    // Verify that the visualizer was registered
    expect(mockContext.registerResponseVisualizer).toHaveBeenCalledWith(
      'json-custom',
      expect.any(Function)
    );
  });

  it('should visualize JSON response', () => {
    // Register the plugin
    jsonVisualizerPlugin.register(mockContext);

    // Get the visualizer function
    const visualizer = (
      mockContext.registerResponseVisualizer as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][1];

    // Sample response data
    const responseData = {
      data: {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      },
    };

    // Call the visualizer
    const result = visualizer(responseData);

    // Verify that the JSON was visualized
    expect(typeof result).toBe('string');
    expect(result).toContain('data');
    expect(result).toContain('users');
    expect(result).toContain('John');
    expect(result).toContain('Jane');
  });

  it('should handle non-JSON response', () => {
    // Register the plugin
    jsonVisualizerPlugin.register(mockContext);

    // Get the visualizer function
    const visualizer = (
      mockContext.registerResponseVisualizer as unknown as ReturnType<typeof vi.fn>
    ).mock.calls[0][1];

    // Call the visualizer with non-JSON data
    const result = visualizer('Not JSON');

    // Verify that the non-JSON data was handled
    expect(typeof result).toBe('string');
    expect(result).toBe('Not JSON');
  });
});
