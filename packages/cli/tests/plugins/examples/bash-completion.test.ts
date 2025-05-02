/**
 * Tests for bash-completion example plugin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bashCompletionPlugin from '../../../src/plugins/examples/bash-completion';
import { CLIPluginContext } from '../../../src/types/cli-plugin.types';

describe('Bash Completion Plugin', () => {
  // Mock plugin context
  let mockContext: CLIPluginContext;
  
  beforeEach(() => {
    // Create a mock context
    mockContext = {
      registerShellCompletion: vi.fn(),
      log: vi.fn(),
      logError: vi.fn()
    } as unknown as CLIPluginContext;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should register the bash completion handler', () => {
    // Register the plugin
    bashCompletionPlugin.register(mockContext);
    
    // Verify that the shell completion was registered
    expect(mockContext.registerShellCompletion).toHaveBeenCalledWith('bash', expect.any(Function));
  });
  
  it('should handle completion for commands', () => {
    // Register the plugin
    bashCompletionPlugin.register(mockContext);
    
    // Get the completion handler
    const completionHandler = (mockContext.registerShellCompletion as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    
    // Call the completion handler with a command line for the first word
    const completions = completionHandler('g', 1);
    
    // Verify that completions were returned
    expect(Array.isArray(completions)).toBe(true);
    expect(completions).toContain('get');
    
    // Test with a different prefix
    const completions2 = completionHandler('p', 1);
    expect(completions2).toContain('post');
    expect(completions2).toContain('put');
    expect(completions2).toContain('patch');
    
    // Test with a non-matching prefix
    const completions3 = completionHandler('z', 1);
    expect(completions3).toEqual([]);
  });
  
  it('should handle completion for list subcommands', () => {
    // Register the plugin
    bashCompletionPlugin.register(mockContext);
    
    // Get the completion handler
    const completionHandler = (mockContext.registerShellCompletion as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    
    // Call the completion handler with a list command
    const completions = completionHandler('list c', 6);
    
    // Verify that completions were returned
    expect(Array.isArray(completions)).toBe(true);
    expect(completions).toContain('collections');
    
    // Test with a different prefix
    const completions2 = completionHandler('list r', 6);
    expect(completions2).toContain('requests');
    
    // Test with a non-matching prefix
    const completions3 = completionHandler('list z', 6);
    expect(completions3).toEqual([]);
  });
  
  it('should not provide completions for unknown command patterns', () => {
    // Register the plugin
    bashCompletionPlugin.register(mockContext);
    
    // Get the completion handler
    const completionHandler = (mockContext.registerShellCompletion as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    
    // Call the completion handler with an unknown command pattern
    const completions = completionHandler('get something else', 18);
    
    // Verify that no completions were returned
    expect(completions).toEqual([]);
    
    // Test with another unknown command pattern
    const completions2 = completionHandler('unknown', 7);
    expect(completions2).toEqual([]);
  });
  
  it('should handle empty input', () => {
    // Register the plugin
    bashCompletionPlugin.register(mockContext);
    
    // Get the completion handler
    const completionHandler = (mockContext.registerShellCompletion as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    
    // Call the completion handler with an empty command line
    const completions = completionHandler('', 0);
    
    // Verify that all commands are returned
    expect(completions).toContain('get');
    expect(completions).toContain('post');
    expect(completions).toContain('put');
    expect(completions).toContain('delete');
    expect(completions).toContain('patch');
    expect(completions).toContain('list');
    expect(completions).toContain('help-more');
  });
});
