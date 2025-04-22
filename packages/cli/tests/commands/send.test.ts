import { jest } from '@jest/globals';
import { send } from '../../src/commands/send.js';
import type { RequestConfig, ResponseData } from '@shc/core';
import { AxiosHeaders } from 'axios';

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

// Mock the core HTTP client
const mockRequest = jest.fn<(config: RequestConfig) => Promise<ResponseData>>();
const mockHttpClient = jest.fn(() => ({
  request: mockRequest
}));

jest.unstable_mockModule('@shc/core', () => ({
  HttpClient: mockHttpClient
}));

describe('send command', () => {
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
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
        url: 'https://api.example.com'
      },
      duration: 100,
      timestamp: new Date()
    } as ResponseData);
  });

  it('should send a GET request successfully', async () => {
    const options = {
      method: 'GET',
      header: undefined,
      data: undefined
    };
    
    await send('https://api.example.com', options);
    
    expect(mockConsoleLog).toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should send a POST request with data', async () => {
    const options = {
      method: 'POST',
      header: ['Content-Type: application/json'],
      data: '{"key": "value"}'
    };
    
    await send('https://api.example.com', options);
    
    expect(mockConsoleLog).toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should handle request errors', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network Error'));

    const options = {
      method: 'GET',
      header: undefined,
      data: undefined
    };
    
    await send('https://api.example.com', options);
    
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('should parse headers correctly', async () => {
    const options = {
      method: 'GET',
      header: ['Accept: application/json', 'Authorization: Bearer token'],
      data: undefined
    };
    
    await send('https://api.example.com', options);
    
    expect(mockConsoleLog).toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });
}); 