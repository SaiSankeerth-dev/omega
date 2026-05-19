import { vi } from 'vitest';

export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $runCommandRaw: vi.fn().mockResolvedValue({ ok: 1 }),
};

vi.mock('../../apps/server/src/lib/prisma', () => ({
  prisma: prismaMock,
  connectDB: vi.fn().mockResolvedValue(undefined),
  disconnectDB: vi.fn().mockResolvedValue(undefined),
}));
