import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '@omega/shared/errors';
import { logger } from '@omega/shared/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // ── Prisma known request errors ────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        code: 'CONFLICT',
        error: 'A record with that value already exists.',
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        error: 'Record not found.',
      });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({
        success: false,
        code: 'BAD_REQUEST',
        error: 'Related record not found.',
      });
    }
  }

  // ── Prisma validation errors ───────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(422).json({
      success: false,
      code: 'VALIDATION_ERROR',
      error: 'Invalid data provided.',
    });
  }

  // ── Prisma connection errors ───────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error('ErrorHandler', 'Prisma initialization error', err);
    return res.status(503).json({
      success: false,
      code: 'SERVICE_UNAVAILABLE',
      error: 'Database connection failed.',
    });
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      error: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      error: 'Token has expired.',
    });
  }

  // ── SyntaxError (malformed JSON body) ─────────────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      code: 'BAD_REQUEST',
      error: 'Malformed JSON in request body.',
    });
  }

  // ── Known operational AppErrors ────────────────────────────────────────────
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      error: err.message,
    });
  }

  // ── Unknown / programmer errors — never leak details ───────────────────────
  logger.error('ErrorHandler', 'Unhandled error', err, {
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    error: 'Something went wrong. Please try again.',
  });
}
