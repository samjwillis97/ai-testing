import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { send } from '../src/commands/send.js';
import { collections } from '../src/commands/collections.js';

// Create a mock program instance
const mockProgram = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  command: vi.fn().mockReturnThis(),
  argument: vi.fn().mockReturnThis(),
  option: vi.fn().mockReturnThis(),
  action: vi.fn().mockReturnThis(),
  addCommand: vi.fn().mockReturnThis(),
  parse: vi.fn().mockReturnThis(),
};

// Mock commander to return our mock program
vi.mock('commander', () => ({
  Command: vi.fn(() => mockProgram),
}));

// Mock the commands
vi.mock('../src/commands/send.js', () => ({
  send: vi.fn(),
}));

vi.mock('../src/commands/collections.js', () => ({
  collections: vi.fn(),
}));

describe('CLI entry point', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    // Import the module to trigger the CLI setup
    await import('../src/index.js');
  });

  it('should set up the CLI program with correct name and version', () => {
    expect(mockProgram.name).toHaveBeenCalledWith('shc');
    expect(mockProgram.description).toHaveBeenCalledWith("Sam's HTTP Client - A versatile HTTP client CLI");
    expect(mockProgram.version).toHaveBeenCalledWith('0.1.0');
  });

  it('should register the send command with correct options', () => {
    const commandInstance = mockProgram.command.mock.results[0].value;
    expect(mockProgram.command).toHaveBeenCalledWith('send');
    expect(commandInstance.description).toHaveBeenCalledWith('Send an HTTP request');
    expect(commandInstance.argument).toHaveBeenCalledWith('<url>', 'URL to send request to');
    expect(commandInstance.option).toHaveBeenCalledWith('-X, --method <method>', 'HTTP method', 'GET');
    expect(commandInstance.option).toHaveBeenCalledWith('-H, --header <header...>', 'HTTP headers');
    expect(commandInstance.option).toHaveBeenCalledWith('-d, --data <data>', 'Request body data');
    expect(commandInstance.action).toHaveBeenCalledWith(send);
  });

  it('should register the collections command', () => {
    const commandInstance = mockProgram.command.mock.results[1].value;
    expect(mockProgram.command).toHaveBeenCalledWith('collections');
    expect(commandInstance.description).toHaveBeenCalledWith('Manage request collections');
    expect(commandInstance.addCommand).toHaveBeenCalledWith(collections);
  });

  it('should parse command line arguments', () => {
    expect(mockProgram.parse).toHaveBeenCalled();
  });
}); 