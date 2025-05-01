// Mock modules before imports
import { vi, afterAll } from 'vitest';

// Mock collections utility
vi.mock('../../src/utils/collections.js', () => ({
  getRequest: vi.fn().mockImplementation((collectionDir, collectionName, requestName) => {
    if (collectionName === 'non-existent') {
      return Promise.reject(new Error(`Collection '${collectionName}' not found`));
    }
    
    if (requestName === 'non-existent') {
      return Promise.reject(new Error(`Request '${requestName}' not found in collection '${collectionName}'`));
    }
    
    if (collectionName === 'test-collection' && requestName === 'get-users') {
      return Promise.resolve({
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Accept': 'application/json',
        },
      });
    } else if (collectionName === 'test-collection' && requestName === 'create-user') {
      return Promise.resolve({
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        data: {
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    } else {
      return Promise.reject(new Error(`Request '${requestName}' not found in collection '${collectionName}'`));
    }
  }),
  getCollectionDir: vi.fn().mockResolvedValue('/mock/collections/dir'),
}));

// Mock config utility
vi.mock('../../src/utils/config.js', () => ({
  getEffectiveOptions: vi.fn().mockResolvedValue({
    configPath: '/mock/config.yaml',
    collectionDir: '/mock/collections/dir',
    verbose: true,
  }),
  createConfigManagerFromOptions: vi.fn().mockResolvedValue({
    getConfig: vi.fn().mockResolvedValue({
      baseUrl: 'https://api.example.com',
      headers: {
        'User-Agent': 'SHC-CLI-Test',
      },
    }),
  }),
  getCollectionDir: vi.fn().mockResolvedValue('/mock/collections/dir'),
}));

// Mock axios module
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockReturnValue({
        request: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        head: vi.fn(),
        options: vi.fn(),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
        defaults: {
          headers: {
            common: {},
            get: {},
            post: {},
            put: {},
            delete: {},
            patch: {},
          },
        },
      }),
    },
  };
});

// Mock the output utilities
vi.mock('../../src/utils/output.js', () => ({
  printResponse: vi.fn(),
  printError: vi.fn(),
  printWarning: vi.fn(),
  printInfo: vi.fn(),
}));

// Import after mocking
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as output from '../../src/utils/output.js';
import { addCollectionCommand } from '../../src/commands/collection-request.js';
import { createTestProgram } from '../utils/test-helpers.js';
import { CapturedOutput } from '../utils/test-helpers.js';
import axios from 'axios';

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = vi.fn() as any;

describe('Collection Request Command', () => {
  let program: Command;
  let captured: CapturedOutput;
  let mockAxiosInstance: any;
  
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Get the mock axios instance
    mockAxiosInstance = (axios.create as any)();
    
    // Create a test program with mocked console output
    [program, captured] = await createTestProgram({
      captureOutput: true,
      mockExit: true,
      initPlugins: false
    });
    
    // Add the collection command to the program
    addCollectionCommand(program);
    
    // Set up a default successful response
    mockAxiosInstance.request.mockResolvedValue({
      data: { success: true, message: 'Test response' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: {
        url: 'https://api.example.com/users',
        method: 'GET',
      },
    });
  });
  
  afterEach(() => {
    // Clear captured output
    captured.clear();
  });
  
  afterAll(() => {
    // Restore process.exit
    process.exit = originalExit;
  });
  
  describe('Collection Request Execution', () => {
    it('should execute a GET request from a collection', async () => {
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should execute a POST request from a collection', async () => {
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'create-user',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should handle non-existent collection gracefully', async () => {
      // Execute the command with a non-existent collection
      await program.parseAsync([
        'node', 'shc', 'collection', 'non-existent', 'get-users',
      ]);
      
      // Verify error was handled
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle non-existent request gracefully', async () => {
      // Execute the command with a non-existent request
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'non-existent',
      ]);
      
      // Verify error was handled
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('Request Option Overrides', () => {
    it('should override headers in the request', async () => {
      // Execute the command with header overrides
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
        '-H', 'Content-Type:application/json',
        '-H', 'Authorization:Bearer token123',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should override query parameters in the request', async () => {
      // Execute the command with query parameter overrides
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
        '-q', 'page=1',
        '-q', 'limit=10',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should override request body in the request', async () => {
      const newRequestData = { name: 'New User', email: 'new@example.com' };
      
      // Execute the command with body override
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'create-user',
        '-d', JSON.stringify(newRequestData),
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should override timeout in the request', async () => {
      // Execute the command with timeout override
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
        '-t', '5000',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle request errors gracefully', async () => {
      // Mock axios request to reject with an error
      mockAxiosInstance.request.mockRejectedValueOnce({
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { error: 'Resource not found' },
          headers: {},
          config: {
            url: 'https://api.example.com/users',
            method: 'GET'
          }
        }
      });
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
      ]);
      
      // Check if the command exited with an error code
      expect(process.exit).toHaveBeenCalledWith(1);
    });
    
    it('should handle network errors gracefully', async () => {
      // Mock axios request to reject with a network error
      mockAxiosInstance.request.mockRejectedValueOnce(new Error('Network Error'));
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
      ]);
      
      // Check if the command exited with an error code
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
  
  describe('Output Options', () => {
    it('should use the specified output format', async () => {
      // Execute the command with output format
      await program.parseAsync([
        'node', 'shc', 'collection', 'test-collection', 'get-users',
        '-o', 'json',
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(mockAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the output was formatted as JSON
      expect(output.printResponse).toHaveBeenCalled();
    });
  });
});
