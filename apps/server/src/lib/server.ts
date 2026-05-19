import http from 'http';
import app from '../index';
import { connectDB, disconnectDB } from './prisma';
import { logger } from '@omega/shared/logger';

const PORT = Number(process.env.PORT ?? 4000);

let server: http.Server;

async function bootstrap(): Promise<void> {
  // Connect DB before accepting traffic
  await connectDB();

  server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info('Server', `Listening on port ${PORT}`);
    logger.info('Server', `Environment: ${process.env.NODE_ENV}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error('Server', `Port ${PORT} is already in use.`);
    } else {
      logger.error('Server', 'Server error', err);
    }
    process.exit(1);
  });
}

// ── Graceful shutdown ──────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  logger.info('Server', `${signal} received — starting graceful shutdown`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info('Server', 'HTTP server closed');
    await disconnectDB();
    logger.info('Server', 'Shutdown complete');
    process.exit(0);
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Server', 'Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Process', 'Unhandled Rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Process', 'Uncaught Exception', err);
  process.exit(1);
});

bootstrap();
