import { sleep } from '../test-utils';

/**
 * Mock HTTP Response
 */
export interface MockResponse<T> {
  status: number;
  data: T;
}

/**
 * Mock HTTP Error
 */
export class MockHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'MockHttpError';
  }
}

/**
 * Mock Network Error
 */
export class MockNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockNetworkError';
  }
}

/**
 * Mock Rate Limit Error
 */
export class MockRateLimitError extends MockHttpError {
  constructor(message: string) {
    super(429, message);
    this.name = 'MockRateLimitError';
  }
}

/**
 * Mock SHC Client for testing
 */
export class MockSHCClient {
  private responseQueue: Array<MockResponse<unknown> | Error> = [];
  private requestDelay = 0;

  /**
   * Queue a response to be returned by the next request
   */
  queueResponse<T>(response: MockResponse<T> | Error): void {
    this.responseQueue.push(response);
  }

  /**
   * Set a delay for all requests
   */
  setRequestDelay(ms: number): void {
    this.requestDelay = ms;
  }

  /**
   * Clear all queued responses
   */
  clearResponses(): void {
    this.responseQueue = [];
  }

  /**
   * Make a request and return the next queued response
   */
  async request<T>(): Promise<MockResponse<T>> {
    if (this.requestDelay > 0) {
      await sleep(this.requestDelay);
    }

    const response = this.responseQueue.shift();
    if (!response) {
      throw new Error('No response queued');
    }

    if (response instanceof Error) {
      throw response;
    }

    return response as MockResponse<T>;
  }
} 