import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { logger } from '@omega/shared/logger';

// ── Silence logger in tests ────────────────────────────────────────────────
vi.spyOn(logger, 'info').mockImplementation(() => {});
vi.spyOn(logger, 'warn').mockImplementation(() => {});
vi.spyOn(logger, 'debug').mockImplementation(() => {});
// Keep logger.error so we can assert on it in tests

// ── Global env setup ───────────────────────────────────────────────────────
beforeAll(() => {
  (process.env as Record<string, string>).NODE_ENV = 'test';
  (process.env as Record<string, string>).DATABASE_URL = 'mongodb://localhost:27017/omega_test';
  (process.env as Record<string, string>).JWT_SECRET = 'test-secret-key-32-chars-minimum!!';
  (process.env as Record<string, string>).PORT = '4001';
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});
