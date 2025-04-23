import { HttpClient } from './client';
import { PluginManager } from './plugin/PluginManager';
import { TemplateResolver } from './plugin/TemplateResolver';
import { PluginType, RequestPreprocessorPlugin, ResponseTransformerPlugin } from './types/plugin';
import { Environment, VariableSet, RequestConfig, ResponseData } from './types';
import axios, { AxiosInstance } from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let client: HttpClient;
  let mockPluginManager: jest.Mocked<PluginManager>;
  let mockTemplateResolver: jest.Mocked<TemplateResolver>;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock plugin manager
    mockPluginManager = {
      loadPlugin: jest.fn(),
      getPlugin: jest.fn(),
      getPluginsByType: jest.fn(),
      unloadPlugin: jest.fn(),
      unloadAllPlugins: jest.fn(),
    } as unknown as jest.Mocked<PluginManager>;

    // Create mock template resolver
    mockTemplateResolver = {
      resolveString: jest.fn(),
      resolveObject: jest.fn(),
      parseTemplate: jest.fn(),
      executeTemplateFunction: jest.fn(),
    } as unknown as jest.Mocked<TemplateResolver>;

    // Mock axios instance
    mockAxiosInstance = {
      request: jest.fn(),
      defaults: { headers: {} }
    } as unknown as jest.Mocked<AxiosInstance>;
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create client instance with dependencies
    client = new HttpClient({
      pluginManager: mockPluginManager,
      templateResolver: mockTemplateResolver
    } as any);
  });

  describe('request handling with plugins and templates', () => {
    it('should process request through plugins and resolve templates', async () => {
      // Mock request preprocessor plugin
      const mockPreprocessor: RequestPreprocessorPlugin = {
        name: 'test-preprocessor',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn().mockImplementation((req: RequestConfig): Promise<RequestConfig> => Promise.resolve({
          ...req,
          headers: { ...req.headers, 'X-Modified': 'true' }
        })),
        providedFunctions: {
          getTimestamp: {
            name: 'getTimestamp',
            description: 'Get current timestamp',
            execute: async () => '2024-02-20T12:00:00Z'
          }
        }
      };

      // Mock response transformer plugin
      const mockTransformer: ResponseTransformerPlugin = {
        name: 'test-transformer',
        version: '1.0.0',
        type: PluginType.RESPONSE_TRANSFORMER,
        execute: jest.fn().mockImplementation((res: ResponseData): Promise<ResponseData> => Promise.resolve({
          ...res,
          data: { ...res.data, transformed: true }
        }))
      };

      // Set up plugin manager mocks
      mockPluginManager.getPluginsByType.mockImplementation((type) => {
        switch (type) {
          case PluginType.REQUEST_PREPROCESSOR:
            return [mockPreprocessor];
          case PluginType.RESPONSE_TRANSFORMER:
            return [mockTransformer];
          default:
            return [];
        }
      });

      // Set up template resolver mocks
      mockTemplateResolver.resolveObject.mockImplementation(async (obj: unknown): Promise<unknown> => {
        const config = obj as RequestConfig;
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Timestamp': '2024-02-20T12:00:00Z'
          }
        };
      });

      // Mock axios response
      const mockResponse: Partial<ResponseData> = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        duration: 100,
        timestamp: new Date()
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      // Test request with templates
      const requestConfig: RequestConfig = {
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {
          'X-Timestamp': '${test-preprocessor.getTimestamp()}'
        }
      };

      const response = await client.request(requestConfig);

      // Verify template resolution
      expect(mockTemplateResolver.resolveObject).toHaveBeenCalledWith(requestConfig);

      // Verify plugin execution
      expect(mockPreprocessor.execute).toHaveBeenCalled();
      expect(mockTransformer.execute).toHaveBeenCalled();

      // Verify final response
      expect(response).toMatchObject({
        data: { message: 'success', transformed: true },
        status: 200,
        headers: expect.any(Object)
      });
    });

    it('should handle environment variables and variable sets', async () => {
      // Set up environment
      const env: Environment = {
        id: 'test-env',
        name: 'Test Environment',
        baseUrl: 'https://api.example.com',
        variables: {
          API_KEY: 'test-key',
          VERSION: 'v1'
        }
      };

      // Set up variable set
      const variableSet: VariableSet = {
        id: 'test-vars',
        name: 'Test Variables',
        variables: {
          TENANT: 'test-tenant'
        },
        isGlobal: true
      };

      // Add environment and variable set
      client.setEnvironment(env);
      client.addGlobalVariableSet(variableSet);

      // Mock template resolution for environment variables
      mockTemplateResolver.resolveObject.mockImplementation(async (obj: unknown): Promise<unknown> => {
        const config = obj as RequestConfig;
        return {
          ...config,
          headers: {
            ...config.headers,
            'X-Api-Key': 'test-key',
            'X-Tenant': 'test-tenant'
          }
        };
      });

      // Mock axios response
      const mockResponse: Partial<ResponseData> = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        duration: 100,
        timestamp: new Date()
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      // Test request with environment variables
      const requestConfig: RequestConfig = {
        url: '/test/${VERSION}',
        method: 'GET',
        headers: {
          'X-Api-Key': '${API_KEY}',
          'X-Tenant': '${TENANT}'
        }
      };

      const response = await client.request(requestConfig);

      // Verify template resolution with environment variables
      expect(mockTemplateResolver.resolveObject).toHaveBeenCalled();
      expect(response.config.headers).toMatchObject({
        'X-Api-Key': 'test-key',
        'X-Tenant': 'test-tenant'
      });
      expect(response.config.url).toContain('v1');
    });

    it('should handle plugin errors gracefully', async () => {
      // Mock failing plugin
      const mockFailingPlugin: RequestPreprocessorPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn().mockRejectedValue(new Error('Plugin error'))
      };

      mockPluginManager.getPluginsByType.mockReturnValue([mockFailingPlugin]);

      const requestConfig: RequestConfig = {
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {}
      };

      // Mock axios response (should not be called)
      mockAxiosInstance.request.mockRejectedValue(new Error('Should not be called'));

      // Expect the request to fail
      await expect(client.request(requestConfig)).rejects.toThrow('Plugin error');

      // Verify error event was emitted
      const errorListener = jest.fn();
      client.on('error', errorListener);

      try {
        await client.request(requestConfig);
      } catch (e) {
        // Expected error
      }

      expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
      expect(mockAxiosInstance.request).not.toHaveBeenCalled();
    });

    it('should emit appropriate events during request lifecycle', async () => {
      const responseListener = jest.fn();
      const pluginAddedListener = jest.fn();
      const environmentChangedListener = jest.fn();

      client.on('response', responseListener);
      client.on('plugin:added', pluginAddedListener);
      client.on('environment:changed', environmentChangedListener);

      // Mock successful response
      const mockResponse: Partial<ResponseData> = {
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        duration: 100,
        timestamp: new Date()
      };
      mockAxiosInstance.request.mockResolvedValueOnce(mockResponse);

      // Add plugin
      const mockPlugin: RequestPreprocessorPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: jest.fn().mockImplementation((req: RequestConfig): Promise<RequestConfig> => Promise.resolve(req))
      };
      client.use(mockPlugin);

      // Change environment
      const env: Environment = {
        id: 'test-env',
        name: 'Test Environment',
        baseUrl: 'https://api.example.com',
        variables: {}
      };
      client.setEnvironment(env);

      // Make request
      await client.request({
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {}
      });

      // Verify events
      expect(pluginAddedListener).toHaveBeenCalledWith(mockPlugin);
      expect(environmentChangedListener).toHaveBeenCalledWith(env);
      expect(responseListener).toHaveBeenCalledWith(expect.objectContaining({
        data: { message: 'success' },
        status: 200
      }));
    });
  });
}); 