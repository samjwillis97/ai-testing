import { describe, it, expect, vi, beforeEach, MockedFunction } from 'vitest';
import { SHCClient } from '../../src/services/client';
import { PluginType } from '../../src/types/plugin.types';
import axios from 'axios';

// Mock axios module
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn()
  };
  
  return {
    default: mockAxios
  };
});

// Create mock axios instance outside the mock
const mockRequestInterceptor = {
  use: vi.fn(),
  eject: vi.fn()
};

const mockResponseInterceptor = {
  use: vi.fn(),
  eject: vi.fn()
};

const mockAxiosInstance = {
  request: vi.fn(),
  interceptors: {
    request: mockRequestInterceptor,
    response: mockResponseInterceptor
  },
  defaults: {
    headers: {
      common: {} as Record<string, string>
    },
    timeout: 30000,
    baseURL: undefined
  }
};

describe('SHCClient', () => {
  let client: ReturnType<typeof SHCClient.create>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the mock instance properties
    mockAxiosInstance.defaults.headers.common = {};
    mockAxiosInstance.defaults.timeout = 30000;
    mockAxiosInstance.defaults.baseURL = undefined;
    
    client = SHCClient.create({
      baseURL: 'https://api.example.com',
      timeout: 5000
    });
  });

  describe('create', () => {
    it('should create a new client instance with the provided configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.example.com',
        timeout: 5000,
        headers: {}
      });
    });

    it('should create a new client instance with default configuration if none provided', () => {
      vi.clearAllMocks();
      const defaultClient = SHCClient.create();
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: undefined,
        timeout: 30000,
        headers: {}
      });
    });
  });

  describe('HTTP methods', () => {
    it('should make a GET request', async () => {
      const responseData = { id: 1, name: 'Test' };
      const mockHeaders = { 'content-type': 'application/json' };
      const mockConfig = {
        url: '/users',
        method: 'GET',
        headers: {},
        params: { page: 1 }
      };
      
      const mockResponse = {
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: mockHeaders,
        config: mockConfig
      };
      
      // Set up the mock implementation
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const response = await client.get('/users', { params: { page: 1 } });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        url: '/users',
        method: 'GET',
        headers: undefined,
        params: { page: 1 },
        data: undefined,
        timeout: undefined
      });
      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.headers).toEqual(mockHeaders);
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should make a POST request with data', async () => {
      const requestData = { name: 'New User' };
      const responseData = { id: 1, name: 'New User' };
      const mockHeaders = { 'content-type': 'application/json' };
      const mockConfig = {
        url: '/users',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        data: requestData
      };
      
      const mockResponse = {
        data: responseData,
        status: 201,
        statusText: 'Created',
        headers: mockHeaders,
        config: mockConfig
      };
      
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      const response = await client.post('/users', requestData, {
        headers: { 'content-type': 'application/json' }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        url: '/users',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        params: undefined,
        data: requestData,
        timeout: undefined
      });
      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(201);
    });

    it('should handle errors correctly', async () => {
      const mockHeaders = { 'content-type': 'application/json' };
      const mockConfig = {
        url: '/users/999',
        method: 'GET',
        headers: {}
      };
      
      const errorResponse = {
        data: { message: 'Not Found' },
        status: 404,
        statusText: 'Not Found',
        headers: mockHeaders,
        config: mockConfig
      };
      
      const axiosError = {
        response: errorResponse,
        isAxiosError: true,
        message: 'Request failed with status code 404',
        name: 'AxiosError',
        code: 'ERR_BAD_REQUEST',
        config: mockConfig,
        request: {},
        toJSON: () => ({})
      };
      
      // Fix: Properly type and mock the isAxiosError function
      (axios.isAxiosError as unknown as MockedFunction<typeof axios.isAxiosError>).mockReturnValueOnce(true);
      mockAxiosInstance.request.mockRejectedValueOnce(axiosError);

      const response = await client.get('/users/999');

      expect(response.status).toBe(404);
      expect(response.data).toEqual({ message: 'Not Found' });
      expect(response.responseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration methods', () => {
    it('should set a default header', () => {
      client.setDefaultHeader('Authorization', 'Bearer token123');
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer token123');
    });

    it('should set the timeout', () => {
      client.setTimeout(10000);
      expect(mockAxiosInstance.defaults.timeout).toBe(10000);
    });

    it('should set the base URL', () => {
      client.setBaseURL('https://new-api.example.com');
      expect(mockAxiosInstance.defaults.baseURL).toBe('https://new-api.example.com');
    });
  });

  describe('Plugin management', () => {
    it('should register a plugin', () => {
      const mockPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: vi.fn()
      };

      client.use(mockPlugin);
      
      // We can't directly test the plugins Map since it's private
      // But we can test that the plugin can be removed
      expect(() => client.removePlugin('test-plugin')).not.toThrow();
    });

    it('should throw an error when registering a plugin without a name', () => {
      const mockPlugin = {
        name: '',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: vi.fn()
      };

      expect(() => client.use(mockPlugin)).toThrow('Plugin must have a name');
    });
  });

  describe('Event handling', () => {
    it('should register and remove event handlers', () => {
      const mockHandler = vi.fn();
      
      // We can't directly test the EventEmitter since it's private
      // But we can at least verify that the methods don't throw
      expect(() => {
        client.on('request', mockHandler);
        client.off('request', mockHandler);
      }).not.toThrow();
    });
  });
});
