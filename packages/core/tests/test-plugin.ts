import { PluginType, SHCPlugin } from '../src/types/plugin.types';

/**
 * A simple test plugin that adds a custom header to requests
 */
export const testPlugin: SHCPlugin = {
  name: 'test-plugin',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  execute: async (config: unknown) => {
    console.log('Test plugin executing...');
    // Type assertion to work with the config object
    const requestConfig = config as Record<string, any>;
    return {
      ...requestConfig,
      headers: {
        ...(requestConfig.headers || {}),
        'X-Test-Plugin': 'Loaded',
      },
    };
  },
  initialize: async () => {
    console.log('Test plugin initialized');
    return undefined;
  },
  destroy: async () => {
    console.log('Test plugin destroyed');
    return undefined;
  },
};
