/// <reference types="jest" />
import { HttpClient } from '../src/index.js';
import axios from 'axios';
import type { RequestConfig, ResponseData, VariableSet } from '../src/types.js';

jest.mock('axios');

describe('HttpClient', () => {
  let client: HttpClient;
  let mockAxiosInstance: jest.Mocked<typeof axios>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      create: jest.fn(),
    } as any;

    (axios as jest.Mocked<typeof axios>).create.mockReturnValue(mockAxiosInstance);

    client = new HttpClient();
  });

  it('should make a successful request', async () => {
    const mockResponse = {
      data: { message: 'success' },
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config: {},
    };

    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    const response = await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ message: 'success' });
    expect(response.duration).toBeDefined();
    expect(response.timestamp).toBeDefined();
  });

  it('should handle request errors', async () => {
    const mockError = new Error('Network error');
    mockAxiosInstance.request.mockRejectedValueOnce(mockError);

    await expect(
      client.request({
        url: 'https://api.example.com/test',
        method: 'GET',
      })
    ).rejects.toThrow('Network error');
  });

  it('should apply environment variables', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} };
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    client.setEnvironment({
      id: 'test-env',
      name: 'test',
      variables: {
        Authorization: 'Bearer ${API_KEY}',
      },
    });

    await client.request({
      url: '/test',
      method: 'GET',
      environmentVariables: {
        Authorization: 'Bearer secret-key',
      },
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        headers: {
          Authorization: 'Bearer secret-key',
        },
      })
    );
  });

  it('should run plugins in order', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} };
    const operations: string[] = [];

    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    client.use({
      name: 'plugin1',
      version: '1.0.0',
      onRequest: async (config: RequestConfig) => {
        operations.push('plugin1-request');
        return config;
      },
      onResponse: async (response: ResponseData) => {
        operations.push('plugin1-response');
        return response;
      },
    });

    client.use({
      name: 'plugin2',
      version: '1.0.0',
      onRequest: async (config: RequestConfig) => {
        operations.push('plugin2-request');
        return config;
      },
      onResponse: async (response: ResponseData) => {
        operations.push('plugin2-response');
        return response;
      },
    });

    await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    expect(operations).toEqual([
      'plugin1-request',
      'plugin2-request',
      'plugin1-response',
      'plugin2-response',
    ]);
  });

  it('should apply global variable sets', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} };
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    const globalVariableSet: VariableSet = {
      id: 'global-vars',
      name: 'Global Variables',
      variables: {
        GLOBAL_KEY: 'global-value',
      },
      isGlobal: true,
    };

    client.addGlobalVariableSet(globalVariableSet);

    client.setEnvironment({
      id: 'test-env',
      name: 'test',
      variables: {
        ENV_KEY: 'env-value',
      },
      baseUrl: 'https://api.example.com',
    });

    await client.request({
      url: '/test/${GLOBAL_KEY}/${ENV_KEY}',
      method: 'GET',
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test/global-value/env-value',
        method: 'GET',
      })
    );
  });

  it('should handle variable set activation and deactivation', async () => {
    const mockResponse = { data: {}, status: 200, headers: {}, config: {} };
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    const variableSet: VariableSet = {
      id: 'test-vars',
      name: 'Test Variables',
      variables: {
        TEST_KEY: 'test-value',
      },
    };

    // Add the variable set to the environment
    client.setEnvironment({
      id: 'test-env',
      name: 'test',
      variables: {},
      variableSets: [variableSet.id],
      baseUrl: 'https://api.example.com',
    });

    // Add the variable set to the client (not as global)
    client.addGlobalVariableSet({ ...variableSet, isGlobal: false });

    // First request with variable set active
    await client.request({
      url: '/test/${TEST_KEY}',
      method: 'GET',
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test/test-value',
        method: 'GET',
      })
    );

    // Deactivate variable set and make second request
    client.deactivateVariableSet(variableSet.id);
    mockAxiosInstance.request.mockClear();
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    await client.request({
      url: '/test/${TEST_KEY}',
      method: 'GET',
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test/${TEST_KEY}',
        method: 'GET',
      })
    );

    // Reactivate variable set and make third request
    client.activateVariableSet(variableSet.id);
    mockAxiosInstance.request.mockClear();
    mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

    await client.request({
      url: '/test/${TEST_KEY}',
      method: 'GET',
    });

    expect(mockAxiosInstance.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test/test-value',
        method: 'GET',
      })
    );
  });

  it('should handle plugin errors', async () => {
    const mockError = new Error('Plugin error');
    const errorHandler = jest.fn();

    client.use({
      name: 'error-plugin',
      version: '1.0.0',
      onRequest: async () => {
        throw mockError;
      },
      onError: errorHandler,
    });

    await expect(
      client.request({
        url: 'https://api.example.com/test',
        method: 'GET',
      })
    ).rejects.toThrow('Plugin error');

    expect(errorHandler).toHaveBeenCalledWith(mockError);
  });
});
