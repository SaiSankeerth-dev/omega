import http from 'node:http';
import { getEnv } from '@omega/config';
import { prisma } from './lib/prisma';

const env = getEnv();

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.FRONTEND_URL,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  function sendJson(statusCode: number, data: unknown): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      ...corsHeaders,
    });
    res.end(JSON.stringify(data));
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // API routes
  if (url.pathname === '/api/health' && req.method === 'GET') {
    sendJson(200, {
      success: true,
      data: {
        status: 'ok',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // 404 for unknown routes
  sendJson(404, {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${url.pathname} not found`,
    },
  });
}

async function main() {
  console.log(`🚀 Omega Server starting...`);
  console.log(`📦 Environment: ${env.NODE_ENV}`);
  console.log(`🔌 Port: ${env.PORT}`);

  try {
    await prisma.$connect();
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  const server = http.createServer(handleRequest);

  server.listen(env.PORT, () => {
    console.log(`✅ Server running on http://localhost:${env.PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await prisma.$disconnect();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await prisma.$disconnect();
    server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Server failed to start:', error);
  process.exit(1);
});
