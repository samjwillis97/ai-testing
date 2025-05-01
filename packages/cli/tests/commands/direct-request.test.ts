/**
 * Tests for direct request command
 */
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { Command } from 'commander';
import path from 'path';
import { addDirectCommand } from '../../src/commands/direct-request.js';
import { createTestProgram, CapturedOutput } from '../utils/test-helpers.js';
import * as output from '../../src/utils/output.js';

// Mock the output utilities to verify they're called correctly
vi.mock('../../src/utils/output.js', () => {
  return {
    printResponse: vi.fn(),
    printError: vi.fn(),
  };
});

// Mock axios module
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios') as any;
  
  // Create a mock implementation that preserves the structure of axios
  return {
    default: {
      ...(actual.default || {}),
      create: vi.fn().mockImplementation(() => {
        // Create a mock axios instance that preserves the structure
        const instance = {
          request: vi.fn().mockImplementation((config) => {
            return Promise.resolve({
              data: { success: true, message: 'Test response' },
              status: 200,
              statusText: 'OK',
              headers: { 'content-type': 'application/json' },
              config: {
                ...config,
                url: config.url || 'https://api.example.com/default',
                method: config.method || 'GET',
              },
            });
          }),
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
        };
        
        // Add all the methods from axios to the instance
        ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
          instance[method] = vi.fn().mockImplementation((url, data, config) => {
            return instance.request({
              method,
              url,
              data,
              ...config,
            });
          });
        });
        
        return instance;
      }),
    },
  };
});

// Import axios after mocking it
import axios from 'axios';

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;
process.exit = vi.fn() as any;

// Mock process.stdout.write to capture raw output
const originalStdoutWrite = process.stdout.write;
process.stdout.write = vi.fn() as any;

describe('Direct Request Command', () => {
  let program: Command;
  let captured: CapturedOutput;
  
  // Get the path to the repo root directory
  const repoRoot = path.resolve(process.cwd(), '..', '..');
  // Path to a real config file
  const configPath = path.resolve(repoRoot, 'configs', 'shc.config.yaml');
  
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a test program with mocked console output
    [program, captured] = await createTestProgram({
      captureOutput: true,
      mockExit: true,
      initPlugins: false
    });
    
    // Add the direct command to the program
    addDirectCommand(program);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  afterAll(() => {
    // Restore process.exit after all tests
    process.exit = originalExit;
    process.stdout.write = originalStdoutWrite;
  });
  
  describe('HTTP Method Commands', () => {
    it('should execute a GET request successfully', async () => {
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the printResponse function was called
      expect(output.printResponse).toHaveBeenCalled();
    });
    
    it('should execute a POST request with data', async () => {
      const requestData = { name: 'Test User', email: 'test@example.com' };
      
      // Create a custom axios instance for this test
      const postAxiosInstance = {
        request: vi.fn().mockResolvedValue({
          data: { success: true, message: 'Created successfully' },
          status: 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' },
          config: {
            url: 'https://api.example.com/users',
            method: 'POST',
            data: requestData
          }
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(postAxiosInstance);
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'post', 'https://api.example.com/users',
        '-c', configPath,
        '-d', JSON.stringify(requestData)
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made with the correct data
      expect(postAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the printResponse function was called
      expect(output.printResponse).toHaveBeenCalled();
    });
    
    it('should execute a PUT request with data', async () => {
      const requestData = { name: 'Updated User' };
      
      // Create a custom axios instance for this test
      const putAxiosInstance = {
        request: vi.fn().mockResolvedValue({
          data: { success: true, message: 'Updated successfully' },
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: {
            url: 'https://api.example.com/users/123',
            method: 'PUT',
            data: requestData
          }
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(putAxiosInstance);
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'put', 'https://api.example.com/users/123',
        '-c', configPath,
        '-d', JSON.stringify(requestData)
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made with the correct data
      expect(putAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the printResponse function was called
      expect(output.printResponse).toHaveBeenCalled();
    });
    
    it('should execute a DELETE request', async () => {
      // Create a custom axios instance for this test
      const deleteAxiosInstance = {
        request: vi.fn().mockResolvedValue({
          data: { success: true, message: 'Deleted successfully' },
          status: 204,
          statusText: 'No Content',
          headers: { 'content-type': 'application/json' },
          config: {
            url: 'https://api.example.com/users/123',
            method: 'DELETE'
          }
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(deleteAxiosInstance);
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'delete', 'https://api.example.com/users/123',
        '-c', configPath
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(deleteAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the printResponse function was called
      expect(output.printResponse).toHaveBeenCalled();
    });
  });
  
  describe('Request Options', () => {
    it('should add headers to the request', async () => {
      // Create a custom axios instance for this test
      const headersAxiosInstance = {
        request: vi.fn().mockImplementation((config) => {
          // Verify that the headers were added to the request
          expect(config.headers).toHaveProperty('Content-Type', 'application/json');
          expect(config.headers).toHaveProperty('Authorization', 'Bearer token123');
          
          return Promise.resolve({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            config
          });
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(headersAxiosInstance);
      
      // Execute the command with headers
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath,
        '-H', 'Content-Type:application/json',
        '-H', 'Authorization:Bearer token123'
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(headersAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should add query parameters to the request', async () => {
      // Create a custom axios instance for this test
      const queryAxiosInstance = {
        request: vi.fn().mockImplementation((config) => {
          // Verify that the query parameters were added to the request
          expect(config.params).toHaveProperty('page', '1');
          expect(config.params).toHaveProperty('limit', '10');
          
          return Promise.resolve({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            config
          });
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(queryAxiosInstance);
      
      // Execute the command with query parameters
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath,
        '-q', 'page=1',
        '-q', 'limit=10'
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(queryAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
    
    it('should set timeout for the request', async () => {
      // Create a custom axios instance for this test
      const timeoutAxiosInstance = {
        request: vi.fn().mockImplementation((config) => {
          // Verify that the timeout was set for the request
          expect(config.timeout).toBe(5000);
          
          return Promise.resolve({
            data: { success: true },
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            config
          });
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(timeoutAxiosInstance);
      
      // Execute the command with timeout
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath,
        '-t', '5000'
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(timeoutAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle request errors gracefully', async () => {
      // We need to mock the axios.create to return a custom instance for this test
      (axios.create as any).mockReturnValueOnce({
        request: vi.fn().mockRejectedValueOnce({
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
        }),
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
      });
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath
      ]);
      
      // Verify error was handled
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Verify that the printError function was called
      expect(output.printError).toHaveBeenCalled();
    });
    
    it('should handle network errors gracefully', async () => {
      // We need to mock the axios.create to return a custom instance for this test
      (axios.create as any).mockReturnValueOnce({
        request: vi.fn().mockRejectedValueOnce(new Error('Network Error')),
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
      });
      
      // Execute the command
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath
      ]);
      
      // Verify error was handled
      expect(process.exit).toHaveBeenCalledWith(1);
      
      // Verify that the printError function was called
      expect(output.printError).toHaveBeenCalled();
    });
  });
  
  describe('Output Options', () => {
    it('should use the specified output format', async () => {
      // Create a custom axios instance for this test
      const formatAxiosInstance = {
        request: vi.fn().mockResolvedValue({
          data: { success: true, message: 'Test response' },
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: {
            url: 'https://api.example.com/users',
            method: 'GET'
          }
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(formatAxiosInstance);
      
      // Execute the command with output format
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath,
        '-o', 'yaml'
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(formatAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that the printResponse function was called with the correct format
      expect(output.printResponse).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ format: 'yaml' })
      );
    });
    
    it('should handle silent mode with raw format', async () => {
      // Create a custom axios instance for this test
      const silentAxiosInstance = {
        request: vi.fn().mockResolvedValue({
          data: { success: true, message: 'Test response' },
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config: {
            url: 'https://api.example.com/users',
            method: 'GET'
          }
        }),
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
      };
      
      // Mock axios.create to return our custom instance for this test
      (axios.create as any).mockReturnValueOnce(silentAxiosInstance);
      
      // Execute the command with silent mode and raw format
      await program.parseAsync([
        'node', 'shc', 'get', 'https://api.example.com/users',
        '-c', configPath,
        '--silent',
        '-o', 'raw'
      ]);
      
      // Verify the axios instance was created
      expect(axios.create).toHaveBeenCalled();
      
      // Verify that the request was made
      expect(silentAxiosInstance.request).toHaveBeenCalled();
      
      // Check if the command executed without error
      expect(process.exit).toHaveBeenCalledWith(0);
      
      // Verify that process.stdout.write was called (raw output)
      expect(process.stdout.write).toHaveBeenCalled();
    });
  });
});
