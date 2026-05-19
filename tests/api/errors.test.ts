import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ErrorCodes,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  validationError,
  internalError,
} from '../../lib/errors/index';

describe('ApiError', () => {
  it('should create an error with correct properties', () => {
    const error = new ApiError(
      ErrorCodes.NOT_FOUND,
      'User not found',
      404,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('ApiError');
  });

  it('should serialize to JSON correctly', () => {
    const error = new ApiError(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid input',
      400,
      { field: 'email' },
    );

    const json = error.toJSON();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.message).toBe('Invalid input');
    expect(json.error.details).toEqual({ field: 'email' });
  });

  it('should create not found errors', () => {
    const error = notFound('User', '123');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.message).toContain('User');
    expect(error.message).toContain('123');
  });

  it('should create bad request errors', () => {
    const error = badRequest('Invalid email format');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
  });

  it('should create unauthorized errors', () => {
    const error = unauthorized();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('should create forbidden errors', () => {
    const error = forbidden();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCodes.FORBIDDEN);
  });

  it('should create conflict errors', () => {
    const error = conflict('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ErrorCodes.CONFLICT);
  });

  it('should create validation errors', () => {
    const details: Record<string, unknown> = { field: 'name' };
    const error = validationError('Invalid data', details);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'name' });
  });

  it('should create internal errors', () => {
    const error = internalError();
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
  });
});
