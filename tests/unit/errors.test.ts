import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '@omega/shared/errors';

describe('AppError', () => {
  it('sets all properties correctly', () => {
    const err = new AppError('Something broke', 500, 'INTERNAL_ERROR');
    expect(err.message).toBe('Something broke');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it('captures stack trace', () => {
    const err = new AppError('test');
    expect(err.stack).toBeDefined();
  });
});

describe('NotFoundError', () => {
  it('defaults to 404 with resource name', () => {
    const err = new NotFoundError('User');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
    expect(err.code).toBe('NOT_FOUND');
  });

  it('uses default resource name', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });
});

describe('ValidationError', () => {
  it('returns 422', () => {
    const err = new ValidationError('Email invalid');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('UnauthorizedError', () => {
  it('returns 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});

describe('ForbiddenError', () => {
  it('returns 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ConflictError', () => {
  it('returns 409', () => {
    const err = new ConflictError('Email already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});

describe('BadRequestError', () => {
  it('returns 400', () => {
    const err = new BadRequestError('Invalid ID format');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
  });
});
