// Centralized error handling for Omega

// Standard API error codes
export const ErrorCodes = {
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',

  // Auth specific
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // AI
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Ensure the prototype chain is correct
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

// Factory functions for common error types
export function notFound(resource: string, id?: string): ApiError {
  return new ApiError(
    ErrorCodes.NOT_FOUND,
    id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`,
    404,
  );
}

export function badRequest(message: string, details?: unknown): ApiError {
  return new ApiError(ErrorCodes.BAD_REQUEST, message, 400, details);
}

export function unauthorized(message = 'Authentication required'): ApiError {
  return new ApiError(ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(message = 'Access denied'): ApiError {
  return new ApiError(ErrorCodes.FORBIDDEN, message, 403);
}

export function conflict(message: string): ApiError {
  return new ApiError(ErrorCodes.CONFLICT, message, 409);
}

export function validationError(
  message: string,
  details?: unknown,
): ApiError {
  return new ApiError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function internalError(message = 'Internal server error'): ApiError {
  return new ApiError(ErrorCodes.INTERNAL_ERROR, message, 500);
}

// Production-safe logger
export function logError(source: string, error: unknown): void {
  if (error instanceof ApiError) {
    console.error(`[${source}] ${error.code}: ${error.message}`);
    return;
  }

  if (error instanceof Error) {
    console.error(`[${source}] ${error.name}: ${error.message}`);
    if (process.env.NODE_ENV !== 'production') {
      console.error(error.stack);
    }
    return;
  }

  console.error(`[${source}] Unknown error:`, error);
}


