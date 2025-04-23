import { describe, it, expect, vi, beforeEach } from 'vitest';
import { send } from '../../src/commands/send.js';
import { HttpClient } from '@shc/core';
import ora from 'ora';
import chalk from 'chalk';

// Mock dependencies
vi.mock('@shc/core', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
  })),
}));

// Mock ora with a proper spinner instance
vi.mock('ora', () => {
  const spinner = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  };
  return {
    default: vi.fn(() => spinner),
  };
});

vi.mock('chalk', () => {
  const mockChalk = {
    blue: vi.fn((str: string) => str),
    red: vi.fn((str: string) => str),
  };
  return { default: mockChalk };
});

describe('send command', () => {
  const mockHttpClient = {
    request: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (HttpClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockHttpClient);
  });

  it('should send a GET request successfully', async () => {
    const mockResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { message: 'success' },
      duration: 100,
    };
    mockHttpClient.request.mockResolvedValueOnce(mockResponse);

    const consoleSpy = vi.spyOn(console, 'log');
    const spinner = ora();
    
    await send('http://example.com', {});

    expect(mockHttpClient.request).toHaveBeenCalledWith({
      url: 'http://example.com',
      method: 'GET',
      headers: {},
      data: undefined,
    });

    expect(ora).toHaveBeenCalledWith('Sending request...');
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalledWith('Request successful');
    expect(consoleSpy).toHaveBeenCalledWith('\nResponse:');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Status:'), 200);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Headers:'));
    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockResponse.headers, null, 2));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('\nBody:'));
    expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify(mockResponse.data, null, 2));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('\nDuration:'), '100ms');
  });

  it('should send a POST request with headers and data', async () => {
    const mockResponse = {
      status: 201,
      headers: { 'content-type': 'application/json' },
      data: { id: 1 },
      duration: 150,
    };
    mockHttpClient.request.mockResolvedValueOnce(mockResponse);

    const options = {
      method: 'POST',
      header: ['Content-Type: application/json', 'Authorization: Bearer token'],
      data: '{"name": "test"}',
    };

    await send('http://example.com', options);

    expect(mockHttpClient.request).toHaveBeenCalledWith({
      url: 'http://example.com',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      },
      data: { name: 'test' },
    });
  });

  it('should handle request failure', async () => {
    const error = new Error('Network error');
    mockHttpClient.request.mockRejectedValueOnce(error);

    const consoleErrorSpy = vi.spyOn(console, 'error');
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const spinner = ora();

    await send('http://example.com', {});

    expect(spinner.fail).toHaveBeenCalledWith('Request failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Network error');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });

  it('should handle invalid JSON data', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const spinner = ora();

    await send('http://example.com', {
      data: 'invalid json',
    });

    expect(spinner.fail).toHaveBeenCalledWith('Request failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('JSON'));
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
  });
});
