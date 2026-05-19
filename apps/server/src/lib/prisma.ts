import { PrismaClient } from '@prisma/client';
import { logger } from '@omega/shared/logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
    errorFormat: 'minimal',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ── Query performance logging in dev ──────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$on('query', (e: { query: string; duration: number }) => {
    if (e.duration > 500) {
      logger.warn('Prisma', `Slow query (${e.duration}ms): ${e.query}`);
    }
  });
}

// ── Connect with retry logic ───────────────────────────────────────────────────
export async function connectDB(
  retries = 5,
  delayMs = 2000,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Prisma', 'Database connected successfully');
      return;
    } catch (err) {
      logger.warn(
        'Prisma',
        `Database connection attempt ${attempt}/${retries} failed.`,
      );

      if (attempt === retries) {
        logger.error('Prisma', 'All database connection attempts failed.', err);
        throw err;
      }

      const backoff = delayMs * attempt;
      logger.info('Prisma', `Retrying in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}

// ── Graceful disconnect ────────────────────────────────────────────────────────
export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Prisma', 'Database disconnected');
}
