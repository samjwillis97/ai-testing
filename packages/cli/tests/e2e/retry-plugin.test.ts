import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, Plugin, RequestConfig, ResponseData } from '@shc/core';
import { send } from '../../src/commands/send.js';
import ora from 'ora';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mock RetryPlugin type
class RetryPlugin implements Plugin {
  name = 'retry';
  version = '1.0.0';
  constructor(private config: Record<string, unknown>) {}
  async onRequest(config: RequestConfig): Promise<RequestConfig> { return config; }
  async onResponse(response: ResponseData): Promise<ResponseData> { return response; }
  async onError(error: Error): Promise<void> {}
}

// Mock dependencies
vi.mock('@shc/core', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
    use: vi.fn()
  })),
}));

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

describe('CLI with Retry Plugin E2E', () => {
  const mockHttpClient = {
    request: vi.fn(),
    use: vi.fn()
  };
  const consoleSpy = vi.spyOn(console, 'log');
  const consoleErrorSpy = vi.spyOn(console, 'error');
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (HttpClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockHttpClient);
  });

  afterEach(() => {
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    mockExit.mockClear();
    vi.useRealTimers();
  });

  it('should retry failed requests according to configuration', async () => {
    // Setup retry plugin configuration
    const retryConfig = {
      maxAttempts: 3,
      conditions: {
        statusCodes: [500, 502, 503],
        networkErrors: true
      },
      backoff: {
        type: 'exponential',
        baseDelay: 100,
        maxDelay: 1000
      }
    };

    // Mock a series of failed requests followed by success
    mockHttpClient.request
      .mockRejectedValueOnce(new Error('Network error')) // First attempt fails
      .mockRejectedValueOnce({ status: 500, message: 'Server error' }) // Second attempt fails
      .mockResolvedValueOnce({ // Third attempt succeeds
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: { message: 'success' },
        duration: 100
      });

    // Execute the send command with retry plugin
    const sendPromise = send('http://example.com', {
      plugins: {
        [`file:${join(__dirname, '../../plugins/retry.ts')}`]: retryConfig
      }
    });

    // Advance timers to handle delays
    await vi.runAllTimersAsync();
    await sendPromise;

    // Verify retry behavior
    expect(mockHttpClient.use).toHaveBeenCalledWith(expect.any(RetryPlugin));
    expect(mockHttpClient.request).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Request successful'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Status: 200'));
  });

  it('should fail after max attempts', async () => {
    // Setup retry plugin configuration with fewer attempts
    const retryConfig = {
      maxAttempts: 2,
      conditions: {
        statusCodes: [500],
        networkErrors: true
      },
      backoff: {
        type: 'exponential',
        baseDelay: 100,
        maxDelay: 1000
      }
    };

    // Mock consistently failing requests
    mockHttpClient.request
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    // Execute the send command with retry plugin
    const sendPromise = send('http://example.com', {
      plugins: {
        [`file:${join(__dirname, '../../plugins/retry.ts')}`]: retryConfig
      }
    });

    // Advance timers to handle delays
    await vi.runAllTimersAsync();
    await sendPromise;

    // Verify failure behavior
    expect(mockHttpClient.use).toHaveBeenCalledWith(expect.any(RetryPlugin));
    expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Network error');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should respect backoff configuration', async () => {
    // Setup retry plugin with specific backoff
    const retryConfig = {
      maxAttempts: 3,
      conditions: {
        statusCodes: [500],
        networkErrors: true
      },
      backoff: {
        type: 'linear',
        baseDelay: 100,
        maxDelay: 300
      }
    };

    // Mock failed requests
    mockHttpClient.request
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'));

    // Execute the send command
    const sendPromise = send('http://example.com', {
      plugins: {
        [`file:${join(__dirname, '../../plugins/retry.ts')}`]: retryConfig
      }
    });

    // Advance timers to handle delays
    await vi.runAllTimersAsync();
    await sendPromise;

    // Verify retry behavior
    expect(mockHttpClient.use).toHaveBeenCalledWith(expect.any(RetryPlugin));
    expect(mockHttpClient.request).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Network error');
  });
}); 