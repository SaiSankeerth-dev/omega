import { logger } from '@omega/shared/logger';
import { disconnectDB } from './prisma';

export function setupProcessErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Process', 'Unhandled Promise Rejection', reason);
    process.exit(1);
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error('Process', 'Uncaught Exception', err);
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    logger.info('Process', 'SIGTERM received — shutting down gracefully');
    await disconnectDB();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('Process', 'SIGINT received — shutting down gracefully');
    await disconnectDB();
    process.exit(0);
  });
}
