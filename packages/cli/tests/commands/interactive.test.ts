/**
 * Tests for interactive command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import inquirer from 'inquirer';
import { addInteractiveCommand } from '../../src/commands/interactive.js';
import * as configUtils from '../../src/utils/config.js';
import path from 'path';
import chalk from 'chalk';

// Mock dependencies
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock('../../src/utils/config.js', () => ({
  getEffectiveOptions: vi.fn(),
  getCollectionDir: vi.fn(),
}));

vi.mock('../../src/utils/collections.js', () => ({
  getRequest: vi.fn(),
  saveRequest: vi.fn(),
  getCollections: vi.fn(),
  getRequests: vi.fn(),
}));

vi.mock('@shc/core', () => ({
  SHCClient: vi.fn(),
}));

// Mock chalk to return the input string (for easier testing)
vi.mock('chalk', () => {
  const mockChalk = (text: string) => text;
  mockChalk.bold = { blue: (text: string) => text };
  mockChalk.blue = (text: string) => text;
  mockChalk.green = (text: string) => text;
  mockChalk.gray = (text: string) => text;
  mockChalk.white = (text: string) => text;
  mockChalk.red = (text: string) => text;
  return { default: mockChalk };
});

describe('Interactive Command', () => {
  let program: Command;
  let processExitSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let interactiveCommand: Command;

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
    
    // Mock fs.mkdir to succeed
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    
    // Mock inquirer.prompt to exit immediately
    vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'exit' });
    
    // Add the interactive command to the program
    addInteractiveCommand(program);
    
    // Get the interactive command
    interactiveCommand = program.commands.find(cmd => cmd.name() === 'interactive')!;
  });

  afterEach(() => {
    vi.clearAllMocks();
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should load config when --config flag is provided', async () => {
    // Mock config data
    const configData = {
      core: {
        http: {
          timeout: 30000,
        },
      },
      storage: {
        collections: {
          path: './custom-collections',
        },
      },
    };
    
    // Mock getEffectiveOptions to return merged config
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({
      ...configData,
      config: '/path/to/config.yaml',
    });
    
    // Mock getCollectionDir to return path from config
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('./custom-collections');
    
    // Execute the command with --config flag
    await interactiveCommand.parseAsync(['interactive', '--config', '/path/to/config.yaml'], { from: 'user' });
    
    // Verify getEffectiveOptions was called with the config path
    expect(configUtils.getEffectiveOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        config: '/path/to/config.yaml',
      })
    );
    
    // Verify getCollectionDir was called with the merged options
    expect(configUtils.getCollectionDir).toHaveBeenCalled();
    
    // Verify mkdir was called with the path from config
    expect(fs.mkdir).toHaveBeenCalledWith('./custom-collections', { recursive: true });
    
    // Verify config information was displayed
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Config loaded from:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Collection directory:'), expect.any(String));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('HTTP timeout:'), expect.any(String));
  });

  it('should use default collection directory when no config or collection-dir is provided', async () => {
    // Mock getEffectiveOptions to return simple options
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
    
    // Mock getCollectionDir to return default path
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/home/user/.shc/collections');
    
    // Execute the command without --config flag
    await interactiveCommand.parseAsync(['interactive'], { from: 'user' });
    
    // Verify getEffectiveOptions was called
    expect(configUtils.getEffectiveOptions).toHaveBeenCalled();
    
    // Verify getCollectionDir was called
    expect(configUtils.getCollectionDir).toHaveBeenCalled();
    
    // Verify mkdir was called with the default path
    expect(fs.mkdir).toHaveBeenCalledWith('/home/user/.shc/collections', { recursive: true });
    
    // Verify no config information was displayed
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Config loaded from:'));
  });

  it('should use collection-dir option when provided', async () => {
    // Mock getEffectiveOptions to return options with collectionDir
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({
      collectionDir: '/custom/collections',
    });
    
    // Mock getCollectionDir to return the custom path
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/custom/collections');
    
    // Execute the command with --collection-dir flag
    await interactiveCommand.parseAsync(['interactive', '--collection-dir', '/custom/collections'], { from: 'user' });
    
    // Verify getEffectiveOptions was called with the collection-dir option
    expect(configUtils.getEffectiveOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionDir: '/custom/collections',
      })
    );
    
    // Verify getCollectionDir was called
    expect(configUtils.getCollectionDir).toHaveBeenCalled();
    
    // Verify mkdir was called with the custom path
    expect(fs.mkdir).toHaveBeenCalledWith('/custom/collections', { recursive: true });
  });

  it('should handle errors when creating collection directory', async () => {
    // Mock getEffectiveOptions to return simple options
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
    
    // Mock fs.mkdir to fail
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    vi.mocked(fs.mkdir).mockRejectedValue(mockError);
    
    // Expect process.exit to be called
    await expect(
      interactiveCommand.parseAsync(['interactive'], { from: 'user' })
    ).rejects.toThrow('Process exited with code 1');
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create collection directory'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should ignore EEXIST error when creating collection directory', async () => {
    // Mock getEffectiveOptions to return simple options
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/test/collections');
    
    // Mock fs.mkdir to fail with EEXIST
    const mockError = new Error('Directory already exists') as NodeJS.ErrnoException;
    mockError.code = 'EEXIST';
    vi.mocked(fs.mkdir).mockRejectedValue(mockError);
    
    // Should not throw or exit
    await interactiveCommand.parseAsync(['interactive'], { from: 'user' });
    
    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
