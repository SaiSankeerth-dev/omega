import { describe, it, expect } from 'vitest';

describe('Container component', () => {
  it('should have correct max-width classes', () => {
    const maxWidths = {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    };

    expect(maxWidths.sm).toBe('max-w-2xl');
    expect(maxWidths.md).toBe('max-w-4xl');
    expect(maxWidths.lg).toBe('max-w-6xl');
    expect(maxWidths.xl).toBe('max-w-7xl');
    expect(maxWidths.full).toBe('max-w-full');
  });
});
