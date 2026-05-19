import { prisma } from '../lib/prisma.js';

export interface HealthResponse {
  status: 'ok' | 'error';
  environment: string;
  database: 'connected' | 'disconnected';
  timestamp: string;
}

export async function healthCheck(): Promise<HealthResponse> {
  let databaseStatus: HealthResponse['database'] = 'disconnected';

  try {
    await prisma.$runCommandRaw({ ping: 1 });
    databaseStatus = 'connected';
  } catch {
    databaseStatus = 'disconnected';
  }

  return {
    status: databaseStatus === 'connected' ? 'ok' : 'error',
    environment: process.env.NODE_ENV || 'development',
    database: databaseStatus,
    timestamp: new Date().toISOString(),
  };
}
