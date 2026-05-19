import express, { Express } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import hpp from 'hpp';
import { logger } from '@omega/shared/logger';

export function applySecurityMiddleware(app: Express): void {
  // ── Trust proxy (for Render, Railway, Heroku etc.) ─────────────────────────
  app.set('trust proxy', 1);

  // ── Security headers via Helmet ────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'same-site' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
  );

  // ── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins =
    process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [
      'http://localhost:3000',
    ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86400,
    }),
  );

  // ── Body parsing with strict size limits ───────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── HTTP Parameter Pollution prevention ────────────────────────────────────
  app.use(hpp());

  // ── NoSQL injection sanitization ───────────────────────────────────────────
  app.use(
    mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ req, key }: { req: express.Request; key: string }) => {
        logger.warn('Security', `Sanitized key: ${key} on ${req.path}`);
      },
    }),
  );

  // ── Gzip compression ───────────────────────────────────────────────────────
  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // ── Global rate limit ──────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        error: 'Too many requests. Please try again later.',
      },
    }),
  );

  // ── Stricter limit for auth routes ─────────────────────────────────────────
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: {
        success: false,
        code: 'TOO_MANY_REQUESTS',
        error: 'Too many authentication attempts.',
      },
    }),
  );

  // ── Request ID middleware ──────────────────────────────────────────────────
  app.use((req, res, next) => {
    const requestId =
      (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });
}
