import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response): Response {
  return res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    error: `Route ${req.method} ${req.path} not found.`,
  });
}
