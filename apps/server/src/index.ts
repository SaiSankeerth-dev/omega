import 'dotenv/config';
import express from 'express';
import { applySecurityMiddleware } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/health';
import { apiRouter } from './routes/api';

const app = express();

// ── Security + parsing middleware ──────────────────────────────────────────
applySecurityMiddleware(app);

// ── Request logging ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api', apiRouter);

// ── 404 handler — must be after all routes ─────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler — must be LAST ────────────────────────────────────
app.use(errorHandler);

export default app;
