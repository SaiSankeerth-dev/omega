import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '@omega/shared/logger';
import { providerHealth } from '@omega/ai/health.js';
import { snapshot } from '@omega/ai/metrics.js';

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

// AI provider health
healthRouter.get('/ai', async (_, res) => {
  const h = await providerHealth();
  res.json(h);
});

// Simple in-memory metrics endpoint for quick monitoring
healthRouter.get('/metrics', (_, res) => {
  res.json(snapshot());
});
