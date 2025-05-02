/**
 * Tests for silent-wrapper utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeSilently } from '../../src/silent-wrapper.js';

describe('Silent Wrapper', () => {
  // Store original console methods for restoration
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  
  // Create spies for console methods
  let consoleLogSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  let consoleDebugSpy: any;
  
  beforeEach(() => {
    // Set up spies for console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  it('should suppress console output during execution', async () => {
    // Function to execute in silent mode
    const testFn = async () => {
      console.log('This should be suppressed');
      console.info('This info should be suppressed');
      console.warn('This warning should be suppressed');
      console.error('This error should be suppressed');
      console.debug('This debug message should be suppressed');
      return 'test result';
    };
    
    // Execute the function in silent mode
    const result = await executeSilently(testFn);
    
    // Verify that console methods were overridden during execution
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleDebugSpy).not.toHaveBeenCalled();
    
    // Verify that the function executed and returned the expected result
    expect(result).toBe('test result');
  });
  
  it('should restore console methods after execution', async () => {
    // Function to execute in silent mode
    const testFn = async () => {
      return 'test result';
    };
    
    // Execute the function in silent mode
    await executeSilently(testFn);
    
    // Execute a function after silent mode
    console.log('This should be logged');
    
    // Verify that console methods were restored
    expect(consoleLogSpy).toHaveBeenCalledWith('This should be logged');
  });
  
  it('should restore console methods even if the function throws an error', async () => {
    // Function that throws an error
    const errorFn = async () => {
      throw new Error('Test error');
    };
    
    // Execute the function in silent mode and catch the error
    try {
      await executeSilently(errorFn);
    } catch (error) {
      // Expected to throw
    }
    
    // Execute a function after silent mode
    console.log('This should be logged');
    
    // Verify that console methods were restored
    expect(consoleLogSpy).toHaveBeenCalledWith('This should be logged');
  });
  
  it('should pass through the thrown error', async () => {
    // Function that throws an error
    const errorFn = async () => {
      throw new Error('Test error');
    };
    
    // Execute the function in silent mode and expect it to throw
    await expect(executeSilently(errorFn)).rejects.toThrow('Test error');
  });
});
