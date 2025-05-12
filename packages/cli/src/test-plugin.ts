import { PluginType } from '@shc/core';
import type { LogEmitter } from '@shc/core';

/**
 * A simple test plugin that adds a custom header to requests
 */
export default {
  name: 'test-plugin',
  version: '1.0.0',
  type: PluginType.REQUEST_PREPROCESSOR,
  // The logEmitter will be provided by the client
  logEmitter: undefined as LogEmitter | undefined,
  
  execute: async function(config: any) {
    // Use the logEmitter if available, otherwise fall back to console.log
    if (this.logEmitter) {
      this.logEmitter.debug('Test plugin executing...');
    } else {
      console.log('Test plugin executing...');
    }
    
    return {
      ...config,
      headers: {
        ...(config.headers || {}),
        'X-Test-Plugin': 'Loaded',
      },
    };
  },
  
  initialize: async function() {
    // Use the logEmitter if available, otherwise fall back to console.log
    if (this.logEmitter) {
      this.logEmitter.info('Test plugin initialized');
    } else {
      console.log('Test plugin initialized');
    }
    return undefined;
  },
  
  destroy: async function() {
    // Use the logEmitter if available, otherwise fall back to console.log
    if (this.logEmitter) {
      this.logEmitter.info('Test plugin destroyed');
    } else {
      console.log('Test plugin destroyed');
    }
    return undefined;
  },
};
