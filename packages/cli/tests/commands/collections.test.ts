import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollectionsCommand, createConfig } from '../../src/commands/collections.js';
import inquirer from 'inquirer';

vi.mock('inquirer');

describe('collections command', () => {
  const mockConfig = createConfig();
  const collections = createCollectionsCommand(mockConfig);
  const consoleSpy = vi.spyOn(console, 'log');

  beforeEach(() => {
    mockConfig.set('collections', []);
    consoleSpy.mockClear();
    vi.clearAllMocks();
  });

  it('should list collections', async () => {
    mockConfig.set('collections', [
      {
        id: '1',
        name: 'Test Collection',
        description: 'Test Description',
        requests: [
          {
            id: '1',
            name: 'Test Request',
            description: 'Test Request Description',
            config: {
              method: 'GET',
              url: 'http://example.com',
            },
          },
        ],
      },
    ]);

    await collections.parseAsync(['node', 'shc.js', 'list']);

    expect(consoleSpy).toHaveBeenCalledWith('\nTest Collection');
    expect(consoleSpy).toHaveBeenCalledWith('-'.repeat('Test Collection'.length));
    expect(consoleSpy).toHaveBeenCalledWith('Test Description');
    expect(consoleSpy).toHaveBeenCalledWith('\nRequests:');
    expect(consoleSpy).toHaveBeenCalledWith('- Test Request: GET http://example.com');
  });

  it('should create a collection', async () => {
    const mockDate = new Date('2024-01-01');
    vi.setSystemTime(mockDate);

    vi.mocked(inquirer.prompt).mockResolvedValueOnce({
      name: 'New Collection',
      description: 'New Description',
    });

    await collections.parseAsync(['node', 'shc.js', 'create']);

    const savedCollections = mockConfig.get('collections');
    expect(savedCollections).toHaveLength(1);
    expect(savedCollections[0]).toEqual({
      id: mockDate.getTime().toString(),
      name: 'New Collection',
      description: 'New Description',
      requests: [],
    });
    expect(consoleSpy).toHaveBeenCalledWith('Collection created: New Collection');

    vi.useRealTimers();
  });

  it('should delete a collection', async () => {
    mockConfig.set('collections', [
      {
        id: '1',
        name: 'Test Collection',
        description: 'Test Description',
        requests: [],
      },
    ]);

    vi.mocked(inquirer.prompt).mockResolvedValueOnce({
      collection: 'Test Collection',
      confirm: true,
    });

    await collections.parseAsync(['node', 'shc.js', 'delete']);

    const savedCollections = mockConfig.get('collections');
    expect(savedCollections).toHaveLength(0);
    expect(consoleSpy).toHaveBeenCalledWith('Collection deleted: Test Collection');
  });

  it('should handle unknown commands', async () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleErrorSpy = vi.spyOn(console, 'error');

    await collections.parseAsync(['node', 'shc.js', 'unknown']);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
