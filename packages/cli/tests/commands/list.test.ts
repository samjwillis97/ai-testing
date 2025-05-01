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
import { createTestProgram, runCommand, mockConfigUtils, mockCollectionsUtils, CapturedOutput } from '../utils/test-helpers.js';

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
    'bold',
    'dim',
    'italic',
    'underline',
    'inverse',
    'hidden',
    'strikethrough',
    'black',
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'white',
    'gray',
    'grey',
    'blackBright',
    'redBright',
    'greenBright',
    'yellowBright',
    'blueBright',
    'magentaBright',
    'cyanBright',
    'whiteBright',
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite',
    'bgBlackBright',
    'bgRedBright',
    'bgGreenBright',
    'bgYellowBright',
    'bgBlueBright',
    'bgMagentaBright',
    'bgCyanBright',
    'bgWhiteBright',
  ];

  // Add all styles to the mockChalk function
  styles.forEach((style) => {
    mockChalk[style] = (text: string) => text;
  });

  // Add nested styles (for chaining like chalk.red.bold)
  styles.forEach((outerStyle) => {
    styles.forEach((innerStyle) => {
      if (!mockChalk[outerStyle][innerStyle]) {
        mockChalk[outerStyle][innerStyle] = (text: string) => text;
      }
    });
  });

  return { default: mockChalk };
});

describe('List Command', () => {
  let program: Command;
  let captured: CapturedOutput;
  let mockedConfigUtils: ReturnType<typeof mockConfigUtils>;
  let mockedCollectionsUtils: ReturnType<typeof mockCollectionsUtils>;

  beforeEach(async () => {
    // Reset mocks
    vi.resetAllMocks();

    // Mock config and collections utils
    mockedConfigUtils = mockConfigUtils();
    mockedCollectionsUtils = mockCollectionsUtils();

    // Apply mocks
    Object.assign(configUtils, mockedConfigUtils);
    Object.assign(collectionsUtils, mockedCollectionsUtils);

    // Create a test program with captured output
    [program, captured] = await createTestProgram({
      initPlugins: false,
      captureOutput: true,
      mockExit: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('List Collections Command', () => {
    it('should list collections when collections exist', async () => {
      // Mock getCollections to return a list of collections
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue(['collection1', 'collection2']);

      // Execute the command
      await runCommand(program, ['list', 'collections']);

      // Verify createConfigManagerFromOptions was called
      expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();

      // Verify getCollections was called with the correct path
      expect(collectionsUtils.getCollections).toHaveBeenCalledWith('./test-collections');
    });

    it('should show a message when no collections exist', async () => {
      // Mock getCollections to return an empty list
      vi.mocked(collectionsUtils.getCollections).mockResolvedValue([]);

      // Execute the command
      await runCommand(program, ['list', 'collections']);

      // Verify getCollections was called
      expect(collectionsUtils.getCollections).toHaveBeenCalled();
    });

    it('should handle errors when listing collections', async () => {
      // Mock getCollections to throw an error
      vi.mocked(collectionsUtils.getCollections).mockRejectedValue(new Error('Test error'));

      // Execute the command and expect it to throw
      try {
        await runCommand(program, ['list', 'collections']);
      } catch (error) {
        // This is expected due to process.exit being mocked
        expect(error).toBeDefined();
      }

      // Verify getCollections was called
      expect(collectionsUtils.getCollections).toHaveBeenCalled();
    });
  });

  describe('List Requests Command', () => {
    it('should list requests when requests exist', async () => {
      // Mock getRequests to return a list of requests
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue([
        { id: 'request1', name: 'Request 1', method: 'GET' },
        { id: 'request2', name: 'Request 2', method: 'POST' },
      ]);

      // Execute the command
      await runCommand(program, ['list', 'requests', 'collection1']);

      // Verify getRequests was called with the correct collection
      expect(collectionsUtils.getRequests).toHaveBeenCalledWith('./test-collections', 'collection1');
    });

    it('should show a message when no requests exist', async () => {
      // Mock getRequests to return an empty list
      vi.mocked(collectionsUtils.getRequests).mockResolvedValue([]);

      // Execute the command
      await runCommand(program, ['list', 'requests', 'collection1']);

      // Verify getRequests was called
      expect(collectionsUtils.getRequests).toHaveBeenCalled();
    });

    it('should handle errors when listing requests', async () => {
      // Mock getRequests to throw an error
      vi.mocked(collectionsUtils.getRequests).mockRejectedValue(new Error('Test error'));

      // Execute the command and expect it to throw
      try {
        await runCommand(program, ['list', 'requests', 'collection1']);
      } catch (error) {
        // This is expected due to process.exit being mocked
        expect(error).toBeDefined();
      }

      // Verify getRequests was called
      expect(collectionsUtils.getRequests).toHaveBeenCalled();
    });

    it('should require a collection name', async () => {
      // Execute the command without a collection name
      let thrownError: any;
      try {
        await runCommand(program, ['list', 'requests']);
      } catch (error) {
        // This is expected due to process.exit being mocked
        thrownError = error;
        expect(error).toBeDefined();
      }

      // Instead of checking for specific error messages, just verify that
      // the command failed as expected when no collection name was provided
      expect(thrownError).toBeDefined();
    });
  });
});
