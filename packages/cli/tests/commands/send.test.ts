import { describe, it, expect, vi, beforeEach } from 'vitest';
import { send } from '../../src/commands/send.js';
import { HttpClient } from '@shc/core';
import ora from 'ora';

// Mock dependencies
vi.mock('@shc/core', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
    use: vi.fn()
  })),
}));

// Mock ora spinner
const spinner = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};

vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue(spinner)
}));

// Mock chalk with proper color functions
vi.mock('chalk', () => {
  const createColorFn = (color: string) => (str: string) => str;
  return {
    default: {
      blue: createColorFn('blue'),
      red: createColorFn('red'),
      yellow: createColorFn('yellow'),
      green: createColorFn('green'),
    },
  };
});

describe('send command', () => {
  const mockHttpClient = {
    request: vi.fn(),
    use: vi.fn()
  };
  const consoleSpy = vi.spyOn(console, 'log');
  const consoleErrorSpy = vi.spyOn(console, 'error');
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    (HttpClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockHttpClient);
  });

  it('should send a GET request successfully', async () => {
    mockHttpClient.request.mockResolvedValueOnce({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { message: 'success' },
      duration: 100
    });

    await send('http://example.com', {});

    expect(ora).toHaveBeenCalledWith('Sending request...');
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalledWith('Request successful');
    expect(consoleSpy).toHaveBeenCalledWith('\nResponse:');
    expect(consoleSpy).toHaveBeenCalledWith('Status:', 200);
  });

  it('should send a POST request with headers and data', async () => {
    mockHttpClient.request.mockResolvedValueOnce({
      status: 201,
      headers: { 'content-type': 'application/json' },
      data: { id: 1 },
      duration: 150
    });

    await send('http://example.com', {
      method: 'POST',
      header: ['Content-Type: application/json'],
      data: '{"name": "test"}'
    });

    expect(ora).toHaveBeenCalledWith('Sending request...');
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalledWith('Request successful');
    expect(mockHttpClient.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'test' }
    }));
  });

  it('should handle request failure', async () => {
    mockHttpClient.request.mockRejectedValueOnce(new Error('Network error'));

    await send('http://example.com', {});

    expect(ora).toHaveBeenCalledWith('Sending request...');
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.fail).toHaveBeenCalledWith('Request failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Network error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle invalid JSON data', async () => {
    await send('http://example.com', {
      method: 'POST',
      data: 'invalid json'
    });

    expect(ora).toHaveBeenCalledWith('Sending request...');
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.fail).toHaveBeenCalledWith('Request failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid JSON data provided');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
