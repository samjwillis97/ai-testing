import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosHeaders } from 'axios';
import type { RequestConfig, ResponseData } from '@shc/core';

// Mock ora
const mockOra = {
  start: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
};
vi.mock('ora', () => ({
  default: () => mockOra,
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Mock the core HTTP client
const mockRequest = vi.fn<(config: RequestConfig) => Promise<ResponseData>>();
const mockHttpClient = vi.fn(() => ({
  request: mockRequest,
}));

vi.mock('@shc/core', () => ({
  HttpClient: mockHttpClient,
}));

describe('send command', () => {
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  let send: (url: string, options: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const headers = new AxiosHeaders();
    headers.set('content-type', 'application/json');

    mockRequest.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers,
      data: { message: 'Success' },
      config: {
        headers,
        method: 'GET',
        url: 'https://api.example.com',
      },
      duration: 100,
      timestamp: new Date(),
    } as ResponseData);

    const module = await import('../../src/commands/send.js');
    send = module.send;
  });

  it('should send a GET request successfully', async () => {
    const options = {
      method: 'GET',
      header: undefined,
      data: undefined,
    };

    await send('https://api.example.com', options);

    expect(mockOra.start).toHaveBeenCalled();
    expect(mockOra.succeed).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Response:'));
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should send a POST request with data', async () => {
    const options = {
      method: 'POST',
      header: ['Content-Type: application/json'],
      data: '{"key": "value"}',
    };

    await send('https://api.example.com', options);

    expect(mockOra.start).toHaveBeenCalled();
    expect(mockOra.succeed).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Response:'));
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should handle request errors', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network Error'));

    const options = {
      method: 'GET',
      header: undefined,
      data: undefined,
    };

    await send('https://api.example.com', options);

    expect(mockOra.fail).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Network Error'));
  });

  it('should parse headers correctly', async () => {
    const options = {
      method: 'GET',
      header: ['Accept: application/json', 'Authorization: Bearer token'],
      data: undefined,
    };

    await send('https://api.example.com', options);

    expect(mockOra.start).toHaveBeenCalled();
    expect(mockOra.succeed).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Response:'));
    expect(mockConsoleError).not.toHaveBeenCalled();
  });
});
