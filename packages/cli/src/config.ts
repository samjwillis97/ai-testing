import type { Collection } from '@shc/core';
import Conf from 'conf';

export const createConfig = () => {
  const config = new Conf<{ collections: Collection[] }>({
    projectName: 'shc',
    projectSuffix: '',
    schema: {
      collections: {
        type: 'array',
        items: {
          type: 'object'
        }
      }
    },
    defaults: {
      collections: [],
    }
  });
  return config;
};