import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConfig } from '../src/config.js';
import Conf from 'conf';

vi.mock('conf', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  })),
}));

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a config instance with default values', () => {
    const config = createConfig();
    expect(config).toBeDefined();
    expect(config.get('collections')).toEqual([]);
    expect(Conf).toHaveBeenCalledWith({
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
  });

  it('should persist and retrieve values', () => {
    const mockConfig = {
      get: vi.fn(),
      set: vi.fn(),
    };
    (Conf as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => mockConfig);

    const config = createConfig();
    const testCollection = {
      id: '1',
      name: 'test',
      requests: [],
    };
    
    mockConfig.get.mockReturnValue([testCollection]);
    
    config.set('collections', [testCollection]);
    expect(config.set).toHaveBeenCalledWith('collections', [testCollection]);
    expect(config.get('collections')).toEqual([testCollection]);
  });
}); 