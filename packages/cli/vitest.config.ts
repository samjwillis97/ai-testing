import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.js',
        '**/*.cjs',
        '**/*.config.{js,ts}',
        '**/vitest.{workspace,setup}.{js,ts}',
        '**/*.{test,spec}.{js,ts}',
      ],
      thresholds: {
        statements: 80,
        branches: 65,
        functions: 80,
        lines: 80,
      },
    },
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json'
    },
    globals: false
  },
});
