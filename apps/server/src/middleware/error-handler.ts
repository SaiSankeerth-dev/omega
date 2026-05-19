import { ApiError, logError } from '../../../../lib/errors';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  // Log unexpected errors
  logError('API', error);

  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  return Response.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : message,
      },
    },
    { status: 500 },
  );
}
