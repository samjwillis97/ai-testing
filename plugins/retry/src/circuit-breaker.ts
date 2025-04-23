import { CircuitBreakerConfig, CircuitState } from './types';

export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: CircuitState = 'CLOSED';
  
  constructor(private config: CircuitBreakerConfig) {}

  public recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  public isOpen(): boolean {
    if (this.state === 'OPEN') {
      const timeElapsed = Date.now() - this.lastFailureTime;
      if (timeElapsed >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  public getState(): CircuitState {
    return this.state;
  }

  public reset(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
    this.state = 'CLOSED';
  }
} 