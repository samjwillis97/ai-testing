/**
 * Tests for help-command example plugin
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import helpCommandPlugin from '../../../src/plugins/examples/help-command';
import { CLIPluginContext } from '../../../src/types/cli-plugin.types';

describe('Help Command Plugin', () => {
  // Mock plugin context
  let mockContext: CLIPluginContext;
  
  beforeEach(() => {
    // Create a mock context
    mockContext = {
      registerCommand: vi.fn(),
      log: vi.fn(),
      logError: vi.fn()
    } as unknown as CLIPluginContext;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should register the help command', () => {
    // Register the plugin
    helpCommandPlugin.register(mockContext);
    
    // Verify that the command was registered
    expect(mockContext.registerCommand).toHaveBeenCalledWith('help-more', expect.any(Function));
  });
  
  it('should handle help command execution', () => {
    // Mock console.log
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Register the plugin
    helpCommandPlugin.register(mockContext);
    
    // Get the command handler
    const commandHandler = (mockContext.registerCommand as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    
    // Call the command handler
    commandHandler();
    
    // Verify that help information was logged
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.mock.calls.some(call => call[0].includes('SHC CLI - Extended Help'))).toBe(true);
    
    // Restore console.log
    consoleLogSpy.mockRestore();
  });
});
