import chalk from 'chalk';

export class CLIError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
    this.name = 'CLIError';
  }
}

export function handleError(error: unknown): never {
  if (error instanceof CLIError) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    process.exit(1);
  }

  console.error(chalk.red('An unknown error occurred'));
  process.exit(1);
}

export function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || !value) {
    throw new CLIError(`${name} is required and must be a non-empty string`);
  }
}

export function assertArray<T>(value: unknown, name: string): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new CLIError(`${name} must be an array`);
  }
}

export function assertObject(value: unknown, name: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new CLIError(`${name} must be an object`);
  }
} 