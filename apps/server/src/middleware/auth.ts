import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@omega/shared/errors';
import { asyncHandler } from './asyncHandler';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Augment Express Request type
declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}

export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = payload;
    next();
  },
);
