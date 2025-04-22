/// <reference types="jest" />
import { HttpClient } from '@/client';
import { Environment, Plugin } from '@/types';

describe('HttpClient', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient();
  });

  test('should make a basic request', async () => {
    const mockResponse = { data: { message: 'success' } };
    jest.spyOn(client['axios'], 'request').mockResolvedValueOnce(mockResponse);

    const response = await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    expect(response.data).toEqual(mockResponse.data);
    expect(response.duration).toBeDefined();
    expect(response.timestamp).toBeInstanceOf(Date);
  });

  test('should handle request errors', async () => {
    const error = new Error('Network error');
    jest.spyOn(client['axios'], 'request').mockRejectedValueOnce(error);

    await expect(client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    })).rejects.toThrow('Network error');
  });

  test('should handle non-Error objects in catch', async () => {
    const errorMessage = 'Unknown error';
    jest.spyOn(client['axios'], 'request').mockRejectedValueOnce(errorMessage);

    await expect(client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    })).rejects.toThrow(errorMessage);
  });

  test('should apply environment variables', async () => {
    const env: Environment = {
      name: 'test',
      variables: {
        API_KEY: 'secret-key',
        BASE_URL: 'https://api.example.com',
      },
      baseUrl: 'https://api.example.com',
    };

    client.setEnvironment(env);

    const mockResponse = { data: { message: 'success' } };
    const requestSpy = jest.spyOn(client['axios'], 'request').mockResolvedValueOnce(mockResponse);

    await client.request({
      url: '/test',
      method: 'GET',
      environmentVariables: {
        token: '${API_KEY}',
      },
    });

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com',
        environmentVariables: {
          token: 'secret-key',
        },
      })
    );
  });

  test('should not apply baseURL if already set in config', async () => {
    const env: Environment = {
      name: 'test',
      variables: {},
      baseUrl: 'https://api.example.com',
    };

    client.setEnvironment(env);

    const mockResponse = { data: { message: 'success' } };
    const requestSpy = jest.spyOn(client['axios'], 'request').mockResolvedValueOnce(mockResponse);

    await client.request({
      url: '/test',
      method: 'GET',
      baseURL: 'https://other-api.example.com',
    });

    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://other-api.example.com',
      })
    );
  });

  test('should run plugins in order', async () => {
    const order: string[] = [];
    const plugin1: Plugin = {
      name: 'plugin1',
      version: '1.0.0',
      onRequest: async (config) => {
        order.push('plugin1:request');
        return config;
      },
      onResponse: async (response) => {
        order.push('plugin1:response');
        return response;
      },
    };

    const plugin2: Plugin = {
      name: 'plugin2',
      version: '1.0.0',
      onRequest: async (config) => {
        order.push('plugin2:request');
        return config;
      },
      onResponse: async (response) => {
        order.push('plugin2:response');
        return response;
      },
    };

    client.use(plugin1);
    client.use(plugin2);

    const mockResponse = { data: { message: 'success' } };
    jest.spyOn(client['axios'], 'request').mockResolvedValueOnce(mockResponse);

    await client.request({
      url: 'https://api.example.com/test',
      method: 'GET',
    });

    expect(order).toEqual([
      'plugin1:request',
      'plugin2:request',
      'plugin1:response',
      'plugin2:response',
    ]);
  });
}); 