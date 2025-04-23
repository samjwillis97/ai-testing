import type { Collection } from '@shc/core';
import Conf from 'conf';
import type { PluginConfig } from './plugins.js';

export interface CLIConfig {
  collections: Collection[];
  plugins?: PluginConfig[];
}

export function createConfig() {
  return new Conf<CLIConfig>({
    projectName: 'shc',
    projectSuffix: '',
    schema: {
      collections: {
        type: 'array',
        items: {
          type: 'object'
        }
      },
      plugins: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            config: { type: 'object' }
          },
          required: ['name']
        },
        default: []
      }
    },
    defaults: {
      collections: [],
      plugins: []
    }
  });
}