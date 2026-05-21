import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'dist', '**/generated/**'],
    testTimeout: 10000,
    hookTimeout: 10000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/generated/**',
        '**/*.config.*',
        '**/index.ts',
        'tests/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    alias: {
      '@omega/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@omega/types': path.resolve(__dirname, 'packages/types/src'),
      '@omega/config': path.resolve(__dirname, 'packages/config/src'),
      '@omega/ui': path.resolve(__dirname, 'packages/ui/src'),
      '@/store': path.resolve(__dirname, 'store'),
      '@/components': path.resolve(__dirname, 'apps/web/src/components'),
      '@/lib': path.resolve(__dirname, 'apps/web/src/lib'),
      '@/styles': path.resolve(__dirname, 'apps/web/src/styles'),
      '@/hooks': path.resolve(__dirname, 'apps/web/src/hooks'),
    },
  },
});
