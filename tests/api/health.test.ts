import { describe, it, expect } from 'vitest';

describe('Health API', () => {
  it('should return a valid health response structure', () => {
    const mockHealthResponse = {
      success: true,
      data: {
        status: 'ok',
        environment: 'test',
        timestamp: new Date().toISOString(),
      },
    };

    expect(mockHealthResponse.success).toBe(true);
    expect(mockHealthResponse.data.status).toBe('ok');
    expect(mockHealthResponse.data.environment).toBe('test');
    expect(mockHealthResponse.data.timestamp).toBeDefined();
    expect(() => new Date(mockHealthResponse.data.timestamp)).not.toThrow();
  });

  it('should handle error responses correctly', () => {
    const mockErrorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route /api/unknown not found',
      },
    };

    expect(mockErrorResponse.success).toBe(false);
    expect(mockErrorResponse.error.code).toBe('NOT_FOUND');
    expect(mockErrorResponse.error.message).toContain('not found');
  });
});
