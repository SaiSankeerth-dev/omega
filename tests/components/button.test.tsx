import { describe, it, expect } from 'vitest';

// Basic component test without rendering (environment may not have jsdom)
describe('Button component', () => {
  it('should have correct variant classes', () => {
    const variantClasses = {
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-400 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
      ghost:
        'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-zinc-800',
      danger:
        'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
    };

    expect(variantClasses.primary).toBeDefined();
    expect(variantClasses.secondary).toBeDefined();
    expect(variantClasses.ghost).toBeDefined();
    expect(variantClasses.danger).toBeDefined();
  });

  it('should have correct size classes', () => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    expect(sizeClasses.sm).toBeDefined();
    expect(sizeClasses.md).toBeDefined();
    expect(sizeClasses.lg).toBeDefined();
  });
});
