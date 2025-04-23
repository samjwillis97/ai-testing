import Conf from 'conf';
import type { Collection } from '@shc/core';

export const createConfig = () =>
  new Conf<{ collections: Collection[] }>({
    projectName: 'shc',
    defaults: {
      collections: [],
    },
  }); 