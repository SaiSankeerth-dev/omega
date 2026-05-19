import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '@omega/shared/logger';

export const healthRouter = Router();

healthRouter.get('/', async (_, res) => {
  const start = Date.now();

  try {
    await prisma.$runCommandRaw({ ping: 1 });

    res.json({
      status: 'ok',
      db: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      responseTime: `${Date.now() - start}ms`,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.1.0',
    });
  } catch {
    logger.error('Health', 'Database health check failed');
    res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});
