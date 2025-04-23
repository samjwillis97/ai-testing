import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RetryPlugin } from '../src';
import { MockSHCClient, MockHttpError, MockNetworkError, MockRateLimitError } from './mocks/shc-client';

describe('RetryPlugin', () => {
  let client: MockSHCClient;
  let plugin: RetryPlugin;

  beforeEach(() => {
    client = new MockSHCClient();
    plugin = new RetryPlugin({
      maxAttempts: 3,
      conditions: {
        statusCodes: [500, 502, 503],
        networkErrors: true,
        customErrors: ['RateLimitError']
      },
      backoff: {
        type: 'exponential',
        baseDelay: 100,
        maxDelay: 1000
      }
    });
  });

  afterEach(() => {
    client.clearResponses();
    plugin.reset();
  });

  describe('Basic retry functionality', () => {
    it('should succeed without retrying on successful request', async () => {
      const expectedData = { id: 1, name: 'test' };
      client.queueResponse({ status: 200, data: expectedData });

      const result = await plugin.execute(() => client.request());

      expect(result.data).toEqual(expectedData);
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(1);
      expect(stats.circuitState).toBe('CLOSED');
    });

    it('should retry on 500 status code and succeed', async () => {
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse({ status: 200, data: { success: true } });

      const result = await plugin.execute(() => client.request());

      expect(result.data).toEqual({ success: true });
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(2);
      expect(stats.circuitState).toBe('CLOSED');
    });

    it('should retry on network error and succeed', async () => {
      client.queueResponse(new MockNetworkError('Connection failed'));
      client.queueResponse({ status: 200, data: { success: true } });

      const result = await plugin.execute(() => client.request());

      expect(result.data).toEqual({ success: true });
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(2);
      expect(stats.circuitState).toBe('CLOSED');
    });

    it('should retry on custom error and succeed', async () => {
      client.queueResponse(new MockRateLimitError('Too many requests'));
      client.queueResponse({ status: 200, data: { success: true } });

      const result = await plugin.execute(() => client.request());

      expect(result.data).toEqual({ success: true });
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(2);
      expect(stats.circuitState).toBe('CLOSED');
    });

    it('should fail after max attempts', async () => {
      for (let i = 0; i < 3; i++) {
        client.queueResponse(new MockHttpError(500, 'Server Error'));
      }

      await expect(plugin.execute(() => client.request())).rejects.toThrow('Server Error');
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(3);
      expect(stats.circuitState).toBe('CLOSED');
    });
  });

  describe('Backoff strategies', () => {
    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse({ status: 200, data: { success: true } });

      const result = await plugin.execute(() => client.request());

      expect(result.data).toEqual({ success: true });
      const stats = plugin.getStats();
      expect(stats.attempts).toBe(3);
      expect(stats.nextRetryDelay).toBeGreaterThan(0);
      expect(stats.circuitState).toBe('CLOSED');
    });
  });

  describe('Circuit breaker', () => {
    beforeEach(() => {
      plugin = new RetryPlugin({
        maxAttempts: 3,
        conditions: {
          statusCodes: [500],
          networkErrors: true
        },
        backoff: {
          type: 'exponential',
          baseDelay: 100,
          maxDelay: 1000
        },
        circuitBreaker: {
          failureThreshold: 2,
          resetTimeout: 1000
        }
      });
    });

    it('should open circuit after failure threshold', async () => {
      // Queue failures to trigger circuit breaker
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse(new MockHttpError(500, 'Server Error')); // For the third request

      await expect(plugin.execute(() => client.request())).rejects.toThrow();
      await expect(plugin.execute(() => client.request())).rejects.toThrow();

      // Circuit should be open now
      await expect(plugin.execute(() => client.request()))
        .rejects.toThrow('Circuit breaker is open');
      
      const stats = plugin.getStats();
      expect(stats.circuitState).toBe('OPEN');
    });

    it('should transition to half-open after reset timeout', async () => {
      // Queue initial failures
      client.queueResponse(new MockHttpError(500, 'Server Error'));
      client.queueResponse(new MockHttpError(500, 'Server Error'));

      await expect(plugin.execute(() => client.request())).rejects.toThrow();
      await expect(plugin.execute(() => client.request())).rejects.toThrow();

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Queue success for half-open state
      client.queueResponse({ status: 200, data: { success: true } });

      const result = await plugin.execute(() => client.request());
      expect(result.data).toEqual({ success: true });
      const stats = plugin.getStats();
      expect(stats.circuitState).toBe('CLOSED');
    });
  });
}); 