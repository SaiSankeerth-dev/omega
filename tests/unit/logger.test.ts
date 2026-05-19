import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@omega/shared/logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls console.log for info', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('Test', 'hello');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[INFO] [Test] hello'));
  });

  it('calls console.warn for warn', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Test', 'warning');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[WARN] [Test] warning'));
  });

  it('calls console.error for error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Test', 'oops');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[ERROR] [Test] oops'));
  });
});
