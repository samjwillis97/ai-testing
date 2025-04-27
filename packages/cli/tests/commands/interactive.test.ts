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
  createConfigManagerFromOptions: vi.fn(),
}));

vi.mock('../../src/utils/collections.js', () => ({
  getRequest: vi.fn(),
  saveRequest: vi.fn(),
  getCollections: vi.fn(),
  getRequests: vi.fn(),
}));

vi.mock('@shc/core', () => ({
  SHCClient: vi.fn(),
  ConfigManager: vi.fn().mockImplementation(() => ({
    loadFromFile: vi.fn(),
    get: vi.fn((path, defaultValue) => {
      if (path === 'core.http.timeout') return 30000;
      if (path === 'storage.collections.path') return './collections';
      return defaultValue;
    }),
    set: vi.fn(),
  })),
}));

// Mock chalk to return the input string (for easier testing)
vi.mock('chalk', () => {
  const mockChalk = (text: string) => text;
  mockChalk.bold = (text: string) => text;
  mockChalk.green = (text: string) => text;
  mockChalk.red = (text: string) => text;
  mockChalk.yellow = (text: string) => text;
  mockChalk.gray = (text: string) => text;
  mockChalk.cyan = (text: string) => text;
  return { default: mockChalk };
});

describe('Interactive Command', () => {
  let program: Command;
  let processExitSpy: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

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
    
    // Mock inquirer.prompt to return 'exit' action by default
    vi.mocked(inquirer.prompt).mockResolvedValue({ action: 'exit' });
    
    // Mock fs.mkdir to succeed
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    
    // Mock getEffectiveOptions to return empty object by default
    vi.mocked(configUtils.getEffectiveOptions).mockResolvedValue({});
    
    // Mock getCollectionDir to return a default path
    vi.mocked(configUtils.getCollectionDir).mockResolvedValue('/default/collections');

    // Mock createConfigManagerFromOptions
    const mockConfigManager = {
      loadFromFile: vi.fn(),
      get: vi.fn((path, defaultValue) => {
        if (path === 'core.http.timeout') return 30000;
        if (path === 'storage.collections.path') return '/default/collections';
        return defaultValue;
      }),
      set: vi.fn(),
    };
    vi.mocked(configUtils.createConfigManagerFromOptions).mockResolvedValue(mockConfigManager as any);
    
    // Add the interactive command to the program
    addInteractiveCommand(program);
  });

  afterEach(() => {
    vi.clearAllMocks();
    processExitSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should create collection directory if it does not exist', async () => {
    // Execute the command
    const interactiveCommand = program.commands.find(cmd => cmd.name() === 'interactive');
    await interactiveCommand?.parseAsync(['interactive'], { from: 'user' });
    
    // Verify createConfigManagerFromOptions was called
    expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
    
    // Verify mkdir was called with the collection directory
    expect(fs.mkdir).toHaveBeenCalledWith('/default/collections', { recursive: true });
    
    // Verify inquirer.prompt was called
    expect(inquirer.prompt).toHaveBeenCalled();
  });

  it('should handle collection directory creation error', async () => {
    // Mock fs.mkdir to throw an error
    const mockError = new Error('Permission denied');
    (mockError as NodeJS.ErrnoException).code = 'EACCES';
    vi.mocked(fs.mkdir).mockRejectedValue(mockError);
    
    // Execute the command
    const interactiveCommand = program.commands.find(cmd => cmd.name() === 'interactive');
    
    // Expect process.exit to be called
    await expect(
      interactiveCommand?.parseAsync(['interactive'], { from: 'user' })
    ).rejects.toThrow('Process exited with code 1');
    
    // Verify createConfigManagerFromOptions was called
    expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
    
    // Verify error output
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create collection directory'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should ignore EEXIST error when creating collection directory', async () => {
    // Mock fs.mkdir to throw an EEXIST error
    const mockError = new Error('Directory already exists');
    (mockError as NodeJS.ErrnoException).code = 'EEXIST';
    vi.mocked(fs.mkdir).mockRejectedValue(mockError);
    
    // Execute the command
    const interactiveCommand = program.commands.find(cmd => cmd.name() === 'interactive');
    await interactiveCommand?.parseAsync(['interactive'], { from: 'user' });
    
    // Verify createConfigManagerFromOptions was called
    expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalled();
    
    // Verify inquirer.prompt was called (process continued)
    expect(inquirer.prompt).toHaveBeenCalled();
    
    // Verify process.exit was not called
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should display config information when config file is loaded', async () => {
    // Mock options with config path
    const options = { config: '/path/to/config.yaml' };
    
    // Execute the command with config option
    const interactiveCommand = program.commands.find(cmd => cmd.name() === 'interactive');
    await interactiveCommand?.parseAsync(['interactive', '--config', '/path/to/config.yaml'], { from: 'user' });
    
    // Verify createConfigManagerFromOptions was called with the correct options
    expect(configUtils.createConfigManagerFromOptions).toHaveBeenCalledWith(
      expect.objectContaining({ config: '/path/to/config.yaml' })
    );
    
    // Verify config information was displayed
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Config loaded from:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Collection directory:'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('HTTP timeout:'));
  });
});
