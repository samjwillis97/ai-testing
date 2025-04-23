import { Command } from 'commander';
import { handleError } from '../utils/error.js';

export abstract class BaseCommand {
  protected program: Command;

  constructor(program: Command) {
    this.program = program;
  }

  protected abstract configure(): void;

  protected async safeAction(action: (...args: unknown[]) => Promise<void> | void): Promise<void> {
    try {
      await action();
    } catch (error) {
      handleError(error);
    }
  }

  public register(): void {
    try {
      this.configure();
    } catch (error) {
      handleError(error);
    }
  }

  protected logSuccess(message: string): void {
    console.log(`✓ ${message}`);
  }

  protected logInfo(message: string): void {
    console.log(`ℹ ${message}`);
  }

  protected logWarning(message: string): void {
    console.warn(`⚠ ${message}`);
  }
} 