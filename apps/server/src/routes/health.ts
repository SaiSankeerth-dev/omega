import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '@omega/shared';

export const healthRouter = Router();

export interface HealthResponse {
  status: 'ok' | 'error';
  environment: string;
  database: 'connected' | 'disconnected';
  uptime: number;
  timestamp: string;
}

healthRouter.get('/', async (_req: Request, res: Response) => {
  let databaseStatus: HealthResponse['database'] = 'disconnected';

  try {
    await prisma.$runCommandRaw({ ping: 1 });
    databaseStatus = 'connected';
  } catch (error) {
    logger.error('Health', 'Database health check failed', error);
  }

  const response: HealthResponse = {
    status: databaseStatus === 'connected' ? 'ok' : 'error',
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  const statusCode = databaseStatus === 'connected' ? 200 : 503;

  res.status(statusCode).json({
    success: statusCode === 200,
    data: response,
  });
});
