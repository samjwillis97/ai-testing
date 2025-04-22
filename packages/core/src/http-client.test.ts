import axios from 'axios';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { HttpClient } from './http-client';
import { HttpRequestOptions } from './types/http-client.types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let client: HttpClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset the mock before each test
    jest.resetAllMocks();
    
    // Create a mock Axios instance with interceptors
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      },
      create: jest.fn()
    };

    mockAxiosInstance.create.mockReturnValue(mockAxiosInstance);
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Create the client
    client = new HttpClient();
  });

  const mockSuccessResponse = (data: any, config: any = {}) => {
    return {
      data,
      status: 200,
      headers: {},
      config,
      responseTime: 100
    };
  };

  const testHttpMethod = async (method: 'get' | 'post' | 'put' | 'delete' | 'patch') => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = mockSuccessResponse(mockData);
    
    mockAxiosInstance[method].mockResolvedValue(mockResponse);

    const url = '/test';
    const options: HttpRequestOptions = { 
      headers: { 'Authorization': 'Bearer token' } 
    };

    const result = method === 'get' || method === 'delete'
      ? await client[method](url, options)
      : await client[method](url, mockData, options);

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
    expect(result.responseTime).toBe(100);
  };

  it.each(['get', 'post', 'put', 'delete', 'patch'])('should support %s method', async (method) => {
    await testHttpMethod(method as 'get' | 'post' | 'put' | 'delete' | 'patch');
  });

  it('should handle request options', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockResponse = mockSuccessResponse(mockData);
    
    mockAxiosInstance.post.mockResolvedValue(mockResponse);

    const options: HttpRequestOptions = {
      headers: { 'Authorization': 'Bearer token' },
      queryParams: { filter: 'active' },
      timeout: 5000,
      proxy: { host: 'proxy.example.com', port: 8080 }
    };

    const result = await client.post('/users', mockData, options);

    expect(result.data).toEqual(mockData);
  });

  it('should transform errors', async () => {
    const errorResponse = {
      response: {
        status: 404,
        data: { message: 'Not Found' }
      },
      message: 'Request failed',
      code: 'ERR_NOT_FOUND'
    };

    mockAxiosInstance.get.mockRejectedValue(errorResponse);

    await expect(client.get('/nonexistent')).rejects.toThrow('Request failed');
  });

  it('should create axios instance with default timeout', () => {
    const axiosCreateSpy = mockedAxios.create;
    
    expect(axiosCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 10000
      })
    );
  });

  it('should allow custom base config', () => {
    const baseConfig = { 
      baseURL: 'https://api.example.com',
      timeout: 5000 
    };
    const customClient = new HttpClient(baseConfig);
    
    const axiosCreateSpy = mockedAxios.create;
    expect(axiosCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com',
        timeout: 5000
      })
    );
  });
});
