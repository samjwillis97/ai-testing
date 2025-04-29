/**
 * Tests for list command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { addListCommand } from '../../src/commands/list.js';
import * as configUtils from '../../src/utils/config.js';
import * as collectionsUtils from '../../src/utils/collections.js';
import chalk from 'chalk';

// Mock dependencies
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('../../src/utils/config.js', () => ({
  getEffectiveOptions: vi.fn(),
  getCollectionDir: vi.fn(),
  createConfigManagerFromOptions: vi.fn(),
}));

vi.mock('../../src/utils/collections.js', () => ({
  getCollections: vi.fn(),
  getRequests: vi.fn(),
}));

vi.mock('@shc/core', () => ({
  ConfigManager: vi.fn().mockImplementation(() => ({
    loadFromFile: vi.fn(),
    get: vi.fn((path, defaultValue) => {
      if (path === 'storage.collections.path') return './collections';
      return defaultValue;
    }),
    set: vi.fn(),
  })),
}));

// Mock chalk to return the input string (for easier testing)
vi.mock('chalk', () => {
  const mockChalk = (text: string) => text;
  
  // Define all possible chalk styles and colors
  const styles = [
    'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough',
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey',
    'blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 
    'magentaBright', 'cyanBright', 'whiteBright', 'bgBlack', 'bgRed', 'bgGreen',
    'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite', 'bgBlackBright',
    'bgRedBright', 'bgGreenBright', 'bgYellowBright', 'bgBlueBright', 'bgMagentaBright',
    'bgCyanBright', 'bgWhiteBright'
  ];
  
  // Add all styles to the mockChalk function
  styles.forEach(style => {
    mockChalk[style] = (text: string) => text;
  });
  
  // Add nested styles (for chaining like chalk.red.bold)
  styles.forEach(outerStyle => {
    styles.forEach(innerStyle => {
      if (!mockChalk[outerStyle][innerStyle]) {
        mockChalk[outerStyle][innerStyle] = (text: string) => text;
      }
    });
  });
  
  return { default: mockChalk };
});

describe('List Command', () => {
  let program: Command;
  let processExitSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let listCommand: Command;
  let collectionsCommand: Command;
  let requestsCommand: Command;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create a new Commander program
    program = new Command();
    
    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((message) => {
      // Log the error message to help with debugging
      console.warn('Console Error:', message);
    });
    
    // Mock createConfigManagerFromOptions
    const mockConfigManager = {
      loadFromFile: vi.fn(),
      get: vi.fn((path, defaultValue) => {
        if (path === 'storage.collections.path') return '/test/collections';
        return defaultValue;
      }),
      set: vi.fn(),
    };
    vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(mockConfigManager as any);
    
    // Add the list command to the program
    addListCommand(program);
    
    // Get the list commands
    listCommand = program.commands.find(cmd => cmd.name() === 'list')!;
    collectionsCommand = listCommand.commands.find(cmd => cmd.name() === 'collections')!;
    requestsCommand = listCommand.commands.find(cmd => cmd.name() === 'requests')!;
  });

  afterEach(() => {
    vi.clearAllMocks();
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('List Collections Command', () => {
    it('should list collections when collections exist', async () => {
      // Mock getCollections to return a list of collections
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue(['collection1', 'collection2']);
      
      // Execute the command
      await collectionsCommand.parseAsync(['collections'], { from: 'user' });
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify getCollections was called with the correct path
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('/test/collections');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Loading collections from'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Collections loaded successfully'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Available collections:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1.'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('collection1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2.'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('collection2'));
    });

    it('should show a message when no collections exist', async () => {
      // Mock getCollections to return an empty list
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue([]);
      
      // Execute the command
      await collectionsCommand.parseAsync(['collections'], { from: 'user' });
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify getCollections was called
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('/test/collections');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No collections found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Collection directory: /test/collections'));
    });

    it('should handle errors when listing collections', async () => {
      // Mock getCollections to throw an error
      const mockError = new Error('Failed to read collections');
      vi.mocked(collectionsUtils.getCollections).mockRejectedValue(mockError);
      
      // Expect process.exit to be called
      await expect(
        collectionsCommand.parseAsync(['collections'], { from: 'user' })
      ).rejects.toThrow('Process exited with code 1');
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify error output
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read collections'));
    });
  });

  describe('List Requests Command', () => {
    it('should list requests when requests exist', async () => {
      // Mock getRequests to return a list of requests
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue([
        { id: 'request1', name: 'Request 1', method: 'GET' },
        { id: 'request2', name: 'Request 2', method: 'POST' }
      ]);
      
      // Mock ConfigManager to return a valid collection directory
      const mockConfigManager = {
        get: vi.fn().mockImplementation((path, defaultValue) => {
          if (path === 'storage.collections.path') return '/test/collections';
          return defaultValue;
        }),
        set: vi.fn(),
        loadFromFile: vi.fn().mockResolvedValue(undefined)
      };
      
      // Mock createConfigManagerFromOptions to return our mock ConfigManager
      vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(mockConfigManager as any);
      
      // Execute the command - need to provide the collection name as the first argument
      await requestsCommand.parseAsync(['testCollection'], { from: 'user' });
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify getRequests was called with the correct parameters
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/test/collections', 'testCollection');
      
      // Verify output - we don't need to check every line of output, just key elements
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Loading requests for collection 'testCollection'"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Requests for collection 'testCollection' loaded successfully"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Requests in collection 'testCollection':"));
    });

    it('should show a message when no requests exist', async () => {
      // Mock getRequests to return an empty list
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue([]);
      
      // Mock ConfigManager to return a valid collection directory
      const mockConfigManager = {
        get: vi.fn().mockImplementation((path, defaultValue) => {
          if (path === 'storage.collections.path') return '/test/collections';
          return defaultValue;
        }),
        set: vi.fn(),
        loadFromFile: vi.fn().mockResolvedValue(undefined)
      };
      
      // Mock createConfigManagerFromOptions to return our mock ConfigManager
      vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(mockConfigManager as any);
      
      // Execute the command - need to provide the collection name as the first argument
      await requestsCommand.parseAsync(['testCollection'], { from: 'user' });
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify getRequests was called
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/test/collections', 'testCollection');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No requests found in collection 'testCollection'"));
    });

    it('should handle errors when listing requests', async () => {
      // Mock getRequests to throw an error
      const mockError = new Error('Failed to read requests');
      vi.mocked(collectionsUtils.getRequests).mockRejectedValue(mockError);
      
      // Mock ConfigManager to return a valid collection directory
      const mockConfigManager = {
        get: vi.fn().mockImplementation((path, defaultValue) => {
          if (path === 'storage.collections.path') return '/test/collections';
          return defaultValue;
        }),
        set: vi.fn(),
        loadFromFile: vi.fn().mockResolvedValue(undefined)
      };
      
      // Mock createConfigManagerFromOptions to return our mock ConfigManager
      vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(mockConfigManager as any);
      
      // Expect process.exit to be called
      await expect(
        requestsCommand.parseAsync(['testCollection'], { from: 'user' })
      ).rejects.toThrow('Process exited with code 1');
      
      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
      
      // Verify error output
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read requests'));
    });
  });
});
