import { Plugin, RequestConfig, ResponseData } from '@shc/core';

interface RetryConfig {
  maxAttempts: number;
  conditions: {
    statusCodes: number[];
    networkErrors: boolean;
  };
  backoff: {
    type: 'linear' | 'exponential';
    baseDelay: number;
    maxDelay: number;
  };
}

export default class RetryPlugin implements Plugin {
  name = 'retry';
  version = '1.0.0';
  private attempts = new Map<string, number>();

  constructor(private config: RetryConfig) {}

  private getRequestId(config: RequestConfig): string {
    return `${config.method}:${config.url}`;
  }

  private shouldRetry(error: Error | { status: number }): boolean {
    if ('status' in error) {
      return this.config.conditions.statusCodes.includes(error.status);
    }
    return this.config.conditions.networkErrors;
  }

  private calculateDelay(attempt: number): number {
    const { type, baseDelay, maxDelay } = this.config.backoff;
    let delay: number;

    if (type === 'linear') {
      delay = baseDelay * attempt;
    } else {
      delay = baseDelay * Math.pow(2, attempt - 1);
    }

    return Math.min(delay, maxDelay);
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const requestId = this.getRequestId(config);
    const currentAttempt = this.attempts.get(requestId) || 0;

    if (currentAttempt >= this.config.maxAttempts) {
      this.attempts.delete(requestId);
      return config;
    }

    if (currentAttempt > 0) {
      const delay = this.calculateDelay(currentAttempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.attempts.set(requestId, currentAttempt + 1);
    return config;
  }

  async onResponse(response: ResponseData): Promise<ResponseData> {
    const requestId = this.getRequestId(response.config as RequestConfig);
    this.attempts.delete(requestId);
    return response;
  }

  async onError(error: Error): Promise<void> {
    if (!this.shouldRetry(error)) {
      throw error;
    }
  }
} 