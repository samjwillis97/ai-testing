import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 10000, // Set a global timeout of 10 seconds for all tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/eslint.config.js',
        '**/types/*.types.ts',
        '**/index.ts',
        '**/tests/**'
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75
      }
    },
    // Increase memory limit to avoid out of memory errors
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096']
      }
    }
  }
});
