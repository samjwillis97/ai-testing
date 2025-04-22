import HttpClient from './http-client';
import { HttpClientPlugin, HttpResponse, HttpClientError } from './types/http-client.types';
import axios from 'axios';

// Mock axios and performance
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient('https://api.example.com');
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('Plugin System', () => {
    it('should allow registering and using pre-request plugins', async () => {
      // Mock a successful axios request
      mockedAxios.request.mockResolvedValue({
        data: { message: 'Success' },
        status: 200,
        headers: {},
      });

      // Create a pre-request plugin that modifies the config
      const preRequestPlugin: HttpClientPlugin = {
        onPreRequest: jest.fn((config) => {
          config.headers = { ...config.headers, 'X-Test-Header': 'Plugin' };
          return config;
        }),
      };

      // Register the plugin
      httpClient.registerPlugin(preRequestPlugin);

      // Make a request
      await httpClient.get<{ message: string }>('/test');

      // Verify the plugin was called and modified the config
      expect(preRequestPlugin.onPreRequest).toHaveBeenCalled();
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Test-Header': 'Plugin',
          }),
        })
      );
    });

    it('should allow post-request plugins to transform response', async () => {
      // Mock a successful axios request
      mockedAxios.request.mockResolvedValue({
        data: { message: 'Original' },
        status: 200,
        headers: {},
      });

      // Create a post-request plugin that transforms the response
      const postRequestPlugin: HttpClientPlugin = {
        onPostRequest: jest.fn((response: HttpResponse<{ message: string }>) => {
          return {
            ...response,
            data: { message: 'Transformed' },
          } as HttpResponse<{ message: string }>;
        }),
      };

      // Register the plugin
      httpClient.registerPlugin(postRequestPlugin);

      // Make a request
      const response = await httpClient.get<{ message: string }>('/test');

      // Verify the plugin was called and transformed the response
      expect(postRequestPlugin.onPostRequest).toHaveBeenCalled();
      expect(response.data.message).toBe('Transformed');
    });

    it('should allow error plugins to handle and transform errors', async () => {
      // Mock an axios error
      const mockError = new Error('Request failed');
      mockedAxios.request.mockRejectedValue(mockError);

      // Create an error plugin that transforms the error
      const errorPlugin: HttpClientPlugin = {
        onError: jest.fn((error: HttpClientError) => {
          return {
            ...error,
            message: 'Transformed error',
          };
        }),
      };

      // Register the plugin
      httpClient.registerPlugin(errorPlugin);

      // Expect the request to throw an error
      await expect(httpClient.get<{ message: string }>('/test')).rejects.toEqual(
        expect.objectContaining({
          message: 'Transformed error',
        })
      );

      // Verify the error plugin was called
      expect(errorPlugin.onError).toHaveBeenCalled();
    });

    it('should support multiple plugins', async () => {
      // Mock a successful axios request
      mockedAxios.request.mockResolvedValue({
        data: { message: 'Original' },
        status: 200,
        headers: {},
      });

      // Create multiple plugins
      const plugin1: HttpClientPlugin = {
        onPreRequest: jest.fn((config) => {
          config.headers = { ...config.headers, 'X-Plugin-1': 'true' };
          return config;
        }),
      };

      const plugin2: HttpClientPlugin = {
        onPostRequest: jest.fn((response: HttpResponse<{ message: string }>) => {
          return {
            ...response,
            data: { message: response.data.message + ' Modified' },
          } as HttpResponse<{ message: string }>;
        }),
      };

      // Register plugins
      httpClient.registerPlugin(plugin1);
      httpClient.registerPlugin(plugin2);

      // Make a request
      const response = await httpClient.get<{ message: string }>('/test');

      // Verify plugins were called
      expect(plugin1.onPreRequest).toHaveBeenCalled();
      expect(plugin2.onPostRequest).toHaveBeenCalled();
      expect(response.data.message).toBe('Original Modified');
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Plugin-1': 'true',
          }),
        })
      );
    });
  });
});
