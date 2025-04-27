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
}));

vi.mock('../../src/utils/collections.js', () => ({
  getCollections: vi.fn(),
  getRequests: vi.fn(),
}));

// Mock chalk to return the input string (for easier testing)
vi.mock('chalk', () => {
  const mockChalk = (text: string) => text;
  mockChalk.bold = (text: string) => text;
  mockChalk.cyan = (text: string) => text;
  mockChalk.green = (text: string) => text;
  mockChalk.yellow = (text: string) => text;
  mockChalk.gray = (text: string) => text;
  mockChalk.red = (text: string) => text;
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
    vi.resetAllMocks();
    program = new Command();
    
    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
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
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getCollections to return a list of collections
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue(['collection1', 'collection2']);
      
      // Execute the command
      await collectionsCommand.parseAsync(['collections'], { from: 'user' });
      
      // Verify getEffectiveOptions was called
      expect(configUtils.getEffectiveOptions).toHaveBeenCalled();
      
      // Verify getCollectionDir was called
      expect(configUtils.getCollectionDir).toHaveBeenCalled();
      
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
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getCollections to return an empty list
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue([]);
      
      // Execute the command
      await collectionsCommand.parseAsync(['collections'], { from: 'user' });
      
      // Verify getCollections was called
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('/test/collections');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No collections found'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Collection directory: /test/collections'));
    });

    it('should handle errors when listing collections', async () => {
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getCollections to throw an error
      const mockError = new Error('Failed to read collections');
      vi.mocked(collectionsUtils.getCollections).mockRejectedValue(mockError);
      
      // Expect process.exit to be called
      await expect(
        collectionsCommand.parseAsync(['collections'], { from: 'user' })
      ).rejects.toThrow('Process exited with code 1');
      
      // Verify error output
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read collections'));
    });
  });

  describe('List Requests Command', () => {
    it('should list requests when requests exist', async () => {
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getRequests to return a list of requests
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue(['request1', 'request2']);
      
      // Execute the command - need to provide the collection name as the first argument
      await requestsCommand.parseAsync(['testCollection'], { from: 'user' });
      
      // Verify getEffectiveOptions was called
      expect(configUtils.getEffectiveOptions).toHaveBeenCalled();
      
      // Verify getCollectionDir was called
      expect(configUtils.getCollectionDir).toHaveBeenCalled();
      
      // Verify getRequests was called with the correct parameters
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/test/collections', 'testCollection');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Loading requests for collection 'testCollection'"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Requests for collection 'testCollection' loaded successfully"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Requests in collection 'testCollection':"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('1.'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('request1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('2.'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('request2'));
    });

    it('should show a message when no requests exist', async () => {
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getRequests to return an empty list
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue([]);
      
      // Execute the command - need to provide the collection name as the first argument
      await requestsCommand.parseAsync(['testCollection'], { from: 'user' });
      
      // Verify getRequests was called
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('/test/collections', 'testCollection');
      
      // Verify output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No requests found in collection 'testCollection'"));
    });

    it('should handle errors when listing requests', async () => {
      // Mock getEffectiveOptions to return simple options
      vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
      
      // Mock getCollectionDir to return a path
      vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
      
      // Mock getRequests to throw an error
      const mockError = new Error('Collection not found');
      vi.mocked(collectionsUtils.getRequests).mockRejectedValue(mockError);
      
      // Expect process.exit to be called
      await expect(
        requestsCommand.parseAsync(['testCollection'], { from: 'user' })
      ).rejects.toThrow('Process exited with code 1');
      
      // Verify error output
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error:'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Collection not found'));
    });
  });
});
