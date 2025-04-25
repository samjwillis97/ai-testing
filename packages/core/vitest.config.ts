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
        statements: 80,
        branches: 65,
        functions: 80,
        lines: 80
      }
    }
  }
});
