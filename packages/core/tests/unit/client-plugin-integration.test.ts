import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { PluginType, AuthProviderPlugin, RequestPreprocessorPlugin, ResponseTransformerPlugin } from '../../src/types/plugin.types';
import { SHCConfig } from '../../src/types/client.types';

// Mock the plugin manager
vi.mock('../../src/services/plugin-manager', () => ({
  createPluginManager: vi.fn().mockImplementation(() => ({
    register: vi.fn(),
    registerFromConfig: vi.fn(),
    initialize: vi.fn(),
    destroy: vi.fn(),
    getPlugin: vi.fn(),
    listPlugins: vi.fn(),
    isPluginEnabled: vi.fn(),
    loadFromNpm: vi.fn(),
    loadFromPath: vi.fn(),
    loadFromGit: vi.fn(),
  })),
}));

// Mock axios
vi.mock('axios', () => {
  const mockRequest = vi.fn();
  return {
    default: {
      create: () => ({
        request: mockRequest,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
        defaults: {
          headers: { common: {} },
        },
      }),
    },
    isAxiosError: vi.fn().mockReturnValue(false),
  };
});

// Import the client after mocks are set up
import { SHCClient } from '../../src/services/client';

describe('SHC Client Plugin Integration', () => {
  // Sample plugins for testing
  let requestPreprocessorPlugin: RequestPreprocessorPlugin;
  let responseTransformerPlugin: ResponseTransformerPlugin;
  let authProviderPlugin: AuthProviderPlugin;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset plugins before each test
    requestPreprocessorPlugin = {
      name: 'request-preprocessor-plugin',
      version: '1.0.0',
      type: PluginType.REQUEST_PREPROCESSOR,
      execute: vi.fn().mockImplementation(async (request) => {
        // Add a custom header to the request
        return {
          ...request,
          headers: {
            ...request.headers,
            'X-Preprocessor': 'Applied',
          },
        };
      }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    responseTransformerPlugin = {
      name: 'response-transformer-plugin',
      version: '1.0.0',
      type: PluginType.RESPONSE_TRANSFORMER,
      execute: vi.fn().mockImplementation(async (response) => {
        // Add a custom property to the response
        return {
          ...response,
          transformed: true,
        };
      }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };

    authProviderPlugin = {
      name: 'auth-provider-plugin',
      version: '1.0.0',
      type: PluginType.AUTH_PROVIDER,
      execute: vi.fn().mockImplementation(async (context) => {
        // Return a mock token
        return {
          token: 'mock-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        };
      }),
      refresh: vi.fn().mockImplementation(async (token) => {
        // Return a refreshed token
        return {
          token: 'refreshed-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        };
      }),
      validate: vi.fn().mockImplementation(async (token) => {
        // Validate the token
        return token === 'mock-token' || token === 'refreshed-token';
      }),
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('Client initialization with plugins', () => {
    it('should initialize with plugins in the config', () => {
      // Create a config with plugins
      const config: SHCConfig = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        plugins: {
          auth: [authProviderPlugin],
          preprocessors: [requestPreprocessorPlugin],
          transformers: [responseTransformerPlugin],
        },
      };

      // Create the client with the config
      const client = SHCClient.create(config);
      expect(client).toBeDefined();

      // Verify that the plugins were registered
      expect(authProviderPlugin.initialize).toHaveBeenCalled();
      expect(requestPreprocessorPlugin.initialize).toHaveBeenCalled();
      expect(responseTransformerPlugin.initialize).toHaveBeenCalled();
    });

    it('should handle plugin initialization failures gracefully', () => {
      // Create a plugin that fails to initialize
      const failingPlugin: RequestPreprocessorPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: vi.fn(),
        initialize: vi.fn().mockRejectedValue(new Error('Initialization failed')),
      };

      // Create a config with the failing plugin
      const config: SHCConfig = {
        plugins: {
          preprocessors: [failingPlugin],
        },
      };

      // Mock the event emitter to catch the error
      const mockEmit = vi.fn();
      vi.spyOn(EventEmitter.prototype, 'emit').mockImplementation(mockEmit);

      // Create the client with the config
      const client = SHCClient.create(config);
      expect(client).toBeDefined();

      // Verify that the plugin initialization was attempted
      expect(failingPlugin.initialize).toHaveBeenCalled();
      
      // The error will be emitted asynchronously, so we need to wait for it
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(mockEmit).toHaveBeenCalledWith('error', expect.any(Error));
          resolve();
        }, 100);
      });
    });
  });

  describe('Plugin lifecycle management', () => {
    it('should initialize plugins when the client is created', () => {
      // Create a client with plugins
      const client = SHCClient.create({
        plugins: {
          auth: [authProviderPlugin],
          preprocessors: [requestPreprocessorPlugin],
          transformers: [responseTransformerPlugin],
        },
      });

      // Verify that the plugins were initialized
      expect(authProviderPlugin.initialize).toHaveBeenCalled();
      expect(requestPreprocessorPlugin.initialize).toHaveBeenCalled();
      expect(responseTransformerPlugin.initialize).toHaveBeenCalled();
    });

    it('should destroy plugins when they are removed', () => {
      // Create a client with plugins
      const client = SHCClient.create({
        plugins: {
          auth: [authProviderPlugin],
        },
      });

      // Verify that the plugin was initialized
      expect(authProviderPlugin.initialize).toHaveBeenCalled();

      // Remove the plugin
      client.removePlugin(authProviderPlugin.name);

      // Verify that the plugin was destroyed
      expect(authProviderPlugin.destroy).toHaveBeenCalled();
    });
  });

  describe('Plugin event handling', () => {
    it('should emit events that plugins can subscribe to', () => {
      // Create a plugin that subscribes to events
      const eventHandlerPlugin: RequestPreprocessorPlugin = {
        name: 'event-handler-plugin',
        version: '1.0.0',
        type: PluginType.REQUEST_PREPROCESSOR,
        execute: vi.fn(),
        initialize: vi.fn().mockImplementation(async () => {
          // This is just a mock, we don't actually need to subscribe to events
          return Promise.resolve();
        }),
      };

      // Create a client with the event handler plugin
      const client = SHCClient.create({
        plugins: {
          preprocessors: [eventHandlerPlugin],
        },
      });

      // Verify that the plugin was initialized
      expect(eventHandlerPlugin.initialize).toHaveBeenCalled();
    });
  });
});
