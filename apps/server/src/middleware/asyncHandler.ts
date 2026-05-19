import { Request, Response, NextFunction, RequestHandler } from 'express';

// Wraps async route handlers — no try/catch needed in every route
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
