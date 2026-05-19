import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorHandler } from '../../apps/server/src/middleware/errorHandler';
import { notFoundHandler } from '../../apps/server/src/middleware/notFound';
import { NotFoundError, ValidationError } from '@omega/shared/errors';

// Minimal test app
const testApp = express();
testApp.use(express.json());

testApp.get('/throw-not-found', () => {
  throw new NotFoundError('Item');
});
testApp.get('/throw-validation', () => {
  throw new ValidationError('Name is required');
});
testApp.get('/throw-unknown', () => {
  throw new Error('Boom');
});
testApp.use(notFoundHandler);
testApp.use(errorHandler);

describe('errorHandler middleware', () => {
  it('handles NotFoundError with 404', async () => {
    const res = await request(testApp).get('/throw-not-found');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.error).toBe('Item not found');
  });

  it('handles ValidationError with 422', async () => {
    const res = await request(testApp).get('/throw-validation');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('hides details for unknown errors', async () => {
    const res = await request(testApp).get('/throw-unknown');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.error).not.toContain('Boom');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(testApp).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
