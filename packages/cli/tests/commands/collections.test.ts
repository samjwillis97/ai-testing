import { jest } from '@jest/globals';
import { collections } from '../../src/commands/collections.js';
import type { Collection, Request } from '@shc/core';

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Mock inquirer
const mockPrompt = jest.fn<(questions: unknown) => Promise<unknown>>();
jest.unstable_mockModule('inquirer', () => ({
  prompt: mockPrompt
}));

// Mock conf
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockConf = jest.fn(() => ({
  get: mockGet,
  set: mockSet
}));

jest.unstable_mockModule('conf', () => mockConf);

describe('collections command', () => {
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  const mockCollection: Collection = {
    id: '1',
    name: 'Test Collection',
    description: 'Test description',
    requests: [
      {
        id: '1',
        name: 'Test Request',
        description: 'Test request description',
        config: {
          url: 'https://api.example.com',
          method: 'GET',
          headers: {}
        }
      } as Request
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue([mockCollection]);
    mockPrompt.mockResolvedValue({ action: 'list' });
  });

  it('should list collections', async () => {
    mockPrompt.mockResolvedValueOnce({ action: 'list' });
    await collections.parseAsync(['list']);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  it('should create a new collection', async () => {
    mockPrompt.mockResolvedValueOnce({
      name: 'New Collection',
      description: 'Test description'
    });

    await collections.parseAsync(['create']);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Collection created'));
  });

  it('should delete a collection', async () => {
    mockPrompt.mockResolvedValueOnce({
      collection: 'Test Collection',
      confirm: true
    });

    await collections.parseAsync(['delete']);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Collection deleted'));
  });

  it('should handle errors gracefully', async () => {
    mockConf.mockImplementationOnce(() => {
      throw new Error('Configuration error');
    });

    await collections.parseAsync(['list']);
    expect(mockConsoleError).toHaveBeenCalled();
  });
}); 