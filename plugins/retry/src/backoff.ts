import { BackoffConfig, BackoffType } from './types';

/**
 * Calculate delay using linear backoff strategy
 * @param attempt Current attempt number
 * @param config Backoff configuration
 * @returns Delay in milliseconds
 */
export function linearBackoff(attempt: number, config: BackoffConfig): number {
  const delay = config.baseDelay * attempt;
  return Math.min(delay, config.maxDelay);
}

/**
 * Calculate delay using exponential backoff strategy
 * @param attempt Current attempt number
 * @param config Backoff configuration
 * @returns Delay in milliseconds
 */
export function exponentialBackoff(attempt: number, config: BackoffConfig): number {
  const delay = config.baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Calculate delay using fibonacci backoff strategy
 * @param attempt Current attempt number
 * @param config Backoff configuration
 * @returns Delay in milliseconds
 */
export function fibonacciBackoff(attempt: number, config: BackoffConfig): number {
  let prev = 0;
  let current = 1;

  for (let i = 0; i < attempt; i++) {
    const next = prev + current;
    prev = current;
    current = next;
  }

  const delay = config.baseDelay * current;
  return Math.min(delay, config.maxDelay);
}

/**
 * Get the appropriate backoff function based on the strategy type
 * @param type Backoff strategy type
 * @returns Backoff calculation function
 */
export function getBackoffStrategy(type: BackoffType): (attempt: number, config: BackoffConfig) => number {
  switch (type) {
    case 'linear':
      return linearBackoff;
    case 'exponential':
      return exponentialBackoff;
    case 'fibonacci':
      return fibonacciBackoff;
    default:
      throw new Error(`Unknown backoff type: ${type}`);
  }
}

/**
 * Calculate the delay for a retry attempt
 * @param attempt Current attempt number
 * @param config Backoff configuration
 * @returns Promise that resolves after the calculated delay
 */
export async function delay(attempt: number, config: BackoffConfig): Promise<void> {
  const backoffFn = getBackoffStrategy(config.type);
  const delayMs = backoffFn(attempt, config);
  await new Promise(resolve => setTimeout(resolve, delayMs));
} 