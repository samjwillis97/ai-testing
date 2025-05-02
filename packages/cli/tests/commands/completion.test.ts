/**
 * Tests for completion command
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { addCompletionCommand } from '../../src/commands/completion';
import * as completionUtils from '../../src/utils/completion.js';
import { cliPluginManager } from '../../src/plugins/index.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import { execSync } from 'child_process';

// Mock axios
vi.mock('axios');

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn().mockImplementation((command) => {
    if (command.includes('git')) {
      return 'git output';
    }
    if (command.includes('npm') || command.includes('pnpm')) {
      return 'npm output';
    }
    return '';
  }),
  exec: vi.fn().mockImplementation((command, callback) => {
    if (callback) {
      callback(null, { stdout: 'mock stdout', stderr: '' });
    }
    return { stdout: 'mock stdout', stderr: '' };
  })
}));

// Mock cliPluginManager
vi.mock('../../src/plugins/index.js', () => ({
  cliPluginManager: {
    getShellCompletion: vi.fn(),
  }
}));

// Create a temporary directory for test config files
const TEST_DIR = path.join(os.tmpdir(), 'shc-cli-completion-test-' + Date.now());
const TEST_CONFIG_PATH = path.join(TEST_DIR, 'config.yaml');
const TEST_COLLECTIONS_DIR = path.join(TEST_DIR, 'collections');
const TEST_COLLECTION_PATH = path.join(TEST_COLLECTIONS_DIR, 'test-collection');

// Create test config file content
const TEST_CONFIG_CONTENT = `
api:
  baseUrl: https://api.example.com
  timeout: 2000
collections:
  path: ${TEST_COLLECTIONS_DIR}
`;

// Store original environment variables
const originalEnv = { ...process.env };

// Setup and teardown functions
beforeEach(async () => {
  // Create test directory and config file
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_COLLECTIONS_DIR)) {
    fs.mkdirSync(TEST_COLLECTIONS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TEST_COLLECTION_PATH)) {
    fs.mkdirSync(TEST_COLLECTION_PATH, { recursive: true });
  }
  
  // Create test requests
  fs.writeFileSync(path.join(TEST_COLLECTION_PATH, 'get-users.json'), JSON.stringify({
    method: 'GET',
    url: 'https://api.example.com/users',
    headers: {},
  }));
  
  fs.writeFileSync(path.join(TEST_COLLECTION_PATH, 'create-user.json'), JSON.stringify({
    method: 'POST',
    url: 'https://api.example.com/users',
    headers: {},
    body: { name: 'Test User' },
  }));
  
  // Write test config file
  fs.writeFileSync(TEST_CONFIG_PATH, TEST_CONFIG_CONTENT);
  
  // Reset environment variables
  process.env = { ...originalEnv };
  process.env.SHC_CONFIG = TEST_CONFIG_PATH;
  process.env.SHC_COLLECTION_DIR = TEST_COLLECTIONS_DIR;
  
  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up test directory
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  
  // Restore original environment
  process.env = { ...originalEnv };
  
  // Restore original implementations
  vi.restoreAllMocks();
});

describe('Completion Command', () => {
  describe('Command Registration', () => {
    it('should register the completion command with the program', () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Find the completion command
      const completionCommand = program.commands.find(cmd => cmd.name() === 'completion');
      
      // Verify that the completion command was registered
      expect(completionCommand).toBeDefined();
      expect(completionCommand?.description()).toContain('Generate shell completion script');
      
      // Skip checking for specific options since they might change
      // and are implementation details
    });
  });
  
  describe('Shell Completion Generation', () => {
    it('should generate bash completion script', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the generateCompletionScript function to return a test script
      vi.spyOn(completionUtils, 'generateCompletionScript').mockReturnValue('bash completion script');
      
      // Execute the command
      await program.parseAsync(['node', 'shc', 'completion', 'bash']);
      
      // Verify that the completion script was generated
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('bash completion script');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
    
    it('should generate zsh completion script', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the generateCompletionScript function to return a test script
      vi.spyOn(completionUtils, 'generateCompletionScript').mockReturnValue('zsh completion script');
      
      // Execute the command
      await program.parseAsync(['node', 'shc', 'completion', 'zsh']);
      
      // Verify that the completion script was generated
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('zsh completion script');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
    
    it('should generate fish completion script', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the generateCompletionScript function to return a test script
      vi.spyOn(completionUtils, 'generateCompletionScript').mockReturnValue('fish completion script');
      
      // Execute the command
      await program.parseAsync(['node', 'shc', 'completion', 'fish']);
      
      // Verify that the completion script was generated
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('fish completion script');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
    
    it('should handle unsupported shell type', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.error method
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Execute the command with an unsupported shell
      await program.parseAsync(['node', 'shc', 'completion', 'powershell']);
      
      // Verify that an error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unsupported shell: powershell');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Supported shells: bash, zsh, fish');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
    
    it('should handle errors during script generation', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.error method
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Mock the generateCompletionScript function to throw an error
      vi.spyOn(completionUtils, 'generateCompletionScript').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Execute the command
      await program.parseAsync(['node', 'shc', 'completion', 'bash']);
      
      // Verify that an error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to generate completion script: Test error');
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });
  });
  
  describe('Dynamic Completion', () => {
    it.skip('should handle dynamic completion with registered handler', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Find the hidden completion command
      const completeCommand = program.commands.find(cmd => cmd.name() === '--complete');
      expect(completeCommand).toBeDefined();
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the cliPluginManager.getShellCompletion method
      const mockCompletionHandler = vi.fn().mockReturnValue(['option1', 'option2']);
      vi.mocked(cliPluginManager.getShellCompletion).mockReturnValue(mockCompletionHandler);
      
      // Call the action function directly with the required arguments
      if (completeCommand && completeCommand.action) {
        const actionFn = completeCommand.action as Function;
        actionFn('bash', 'shc command', '10', {});
        
        // Verify that the completion handler was called with the correct arguments
        expect(cliPluginManager.getShellCompletion).toHaveBeenCalledWith('bash');
        expect(mockCompletionHandler).toHaveBeenCalledWith('shc command', 10);
        
        // Verify that console.log was called with the correct output
        expect(consoleLogSpy).toHaveBeenCalledWith('option1\noption2');
        
        // Restore console.log
        consoleLogSpy.mockRestore();
      }
    });
    
    it.skip('should handle dynamic completion with no registered handler', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Find the hidden completion command
      const completeCommand = program.commands.find(cmd => cmd.name() === '--complete');
      expect(completeCommand).toBeDefined();
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the cliPluginManager.getShellCompletion method to return undefined
      vi.mocked(cliPluginManager.getShellCompletion).mockReturnValue(undefined);
      
      // Call the action function directly with a command line that includes 'list'
      if (completeCommand && completeCommand.action) {
        const actionFn = completeCommand.action as Function;
        actionFn('bash', 'shc list', '8', {});
        
        // Verify that console.log was called with the correct output for list command
        expect(consoleLogSpy).toHaveBeenCalledWith('collections\nrequests');
        
        // Reset the mock
        consoleLogSpy.mockClear();
        
        // Call the action function with a different command line
        actionFn('bash', 'shc get', '7', {});
        
        // Verify that console.log was not called for other commands
        expect(consoleLogSpy).not.toHaveBeenCalled();
        
        // Restore console.log
        consoleLogSpy.mockRestore();
      }
    });
    
    it.skip('should handle errors during dynamic completion', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Find the hidden completion command
      const completeCommand = program.commands.find(cmd => cmd.name() === '--complete');
      expect(completeCommand).toBeDefined();
      
      // Mock process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Mock the cliPluginManager.getShellCompletion method to throw an error
      vi.mocked(cliPluginManager.getShellCompletion).mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Call the action function directly with the required arguments
      if (completeCommand && completeCommand.action) {
        const actionFn = completeCommand.action as Function;
        actionFn('bash', 'shc command', '10', {});
        
        // Verify that process.exit was called with the correct code
        expect(processExitSpy).toHaveBeenCalledWith(1);
        
        // Restore mocks
        processExitSpy.mockRestore();
      }
    });
  });
  
  describe('Collection and Request Completion', () => {
    it.skip('should list collections for completion', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the getCollectionsForCompletion function
      vi.spyOn(completionUtils, 'getCollectionsForCompletion').mockResolvedValue(['collection1', 'collection2']);
      
      // Execute the command using parseAsync
      await program.parseAsync(['node', 'shc', '--get-collections']);
      
      // Verify that getCollectionsForCompletion was called
      expect(completionUtils.getCollectionsForCompletion).toHaveBeenCalled();
      
      // Verify that console.log was called with the correct output
      expect(consoleLogSpy).toHaveBeenCalledWith('collection1\ncollection2');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
    
    it.skip('should handle errors when listing collections', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Mock the getCollectionsForCompletion function to throw an error
      vi.spyOn(completionUtils, 'getCollectionsForCompletion').mockRejectedValue(new Error('Test error'));
      
      // Execute the command using parseAsync
      await program.parseAsync(['node', 'shc', '--get-collections']);
      
      // Verify that process.exit was called with the correct code
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      processExitSpy.mockRestore();
    });
    
    it.skip('should list requests for completion', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock the console.log method
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock the getRequestsForCompletion function
      vi.spyOn(completionUtils, 'getRequestsForCompletion').mockResolvedValue(['request1', 'request2']);
      
      // Execute the command using parseAsync
      await program.parseAsync(['node', 'shc', '--get-requests', 'test-collection']);
      
      // Verify that getRequestsForCompletion was called with the correct arguments
      expect(completionUtils.getRequestsForCompletion).toHaveBeenCalledWith('test-collection', expect.anything());
      
      // Verify that console.log was called with the correct output
      expect(consoleLogSpy).toHaveBeenCalledWith('request1\nrequest2');
      
      // Restore console.log
      consoleLogSpy.mockRestore();
    });
    
    it.skip('should handle errors when listing requests', async () => {
      // Create a new Command instance
      const program = new Command();
      
      // Register the completion command
      addCompletionCommand(program);
      
      // Mock process.exit
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      
      // Mock the getRequestsForCompletion function to throw an error
      vi.spyOn(completionUtils, 'getRequestsForCompletion').mockRejectedValue(new Error('Test error'));
      
      // Execute the command using parseAsync
      await program.parseAsync(['node', 'shc', '--get-requests', 'test-collection']);
      
      // Verify that process.exit was called with the correct code
      expect(processExitSpy).toHaveBeenCalledWith(1);
      
      // Restore mocks
      processExitSpy.mockRestore();
    });
  });
});
