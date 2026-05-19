import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@omega/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@omega/config': path.resolve(__dirname, 'packages/config/src'),
      '@omega/ui': path.resolve(__dirname, 'packages/ui/src'),
    },
  },
});
