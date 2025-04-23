/// <reference types="jest" />
import { vi } from 'vitest';

/**
 * Sleep for a specified duration
 * @param ms Duration in milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

type Timer = NodeJS.Timeout;
type TimerFunction = jest.Mock<Timer>;

const timerMocks = new Map<Timer, TimerFunction>();

/**
 * Mock implementation of setTimeout for testing
 */
export const mockSetTimeout = () => {
  const originalSetTimeout = setTimeout;
  
  return jest.spyOn(globalThis, 'setTimeout').mockImplementation((callback: () => void, ms?: number) => {
    const timer = originalSetTimeout(callback, ms);
    const mockTimer = jest.fn(() => timer);
    timerMocks.set(timer, mockTimer as TimerFunction);
    return timer;
  });
};

/**
 * Clear all timer mocks
 */
export const clearTimerMocks = (): void => {
  timerMocks.clear();
  jest.clearAllMocks();
};

/**
 * Use fake timers for testing
 */
export const useFakeTimers = (): void => {
  vi.useFakeTimers();
}; 