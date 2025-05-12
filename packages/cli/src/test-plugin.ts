import { PluginType } from '@shc/core';

/**
 * A simple test plugin that adds a custom header to requests
 */
export default {
  name: 'test-plugin',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  execute: async (config: any) => {
    console.log('Test plugin executing...');
    return {
      ...config,
      headers: {
        ...(config.headers || {}),
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
