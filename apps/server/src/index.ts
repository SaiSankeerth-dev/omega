import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { getEnv } from '@omega/config';
import { logger } from '@omega/shared';
import { prisma } from './lib/prisma.js';
import { healthRouter } from './routes/health.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

const env = getEnv();

const app = express();

// ── Security middleware ────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use(limiter);

// ── Request parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Logging ───────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);

// ── Error handling ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Server start ──────────────────────────────────────────────────
async function main() {
  logger.info('Server', 'Omega Server starting...', {
    environment: env.NODE_ENV,
    port: env.PORT,
  });

  try {
    await prisma.$connect();
    logger.info('Server', 'MongoDB connected successfully');
  } catch (error) {
    logger.error('Server', 'Failed to connect to MongoDB', error);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    logger.info('Server', `Server running on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('Server', `Received ${signal}, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server', 'Server shut down gracefully');
      process.exit(0);
    });
    // Force shutdown after 10s
    setTimeout(() => {
      logger.error('Server', 'Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Server', 'Server failed to start', error);
  process.exit(1);
});

export { app };
