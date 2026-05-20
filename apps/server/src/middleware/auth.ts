import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@omega/shared/errors';
import { asyncHandler } from './asyncHandler';
import { verifyToken, type AccessTokenPayload } from '../lib/token';
import { validateSession } from '../lib/sessions';

export type JwtPayload = AccessTokenPayload;

// Augment Express Request type
declare module 'express' {
  interface Request {
    user?: JwtPayload;
    sessionId?: string;
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

    const payload = verifyToken<JwtPayload>(token);
    const validSession = await validateSession(payload.sessionId, payload.userId);

    if (!validSession) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    req.user = payload;
    req.sessionId = payload.sessionId;
    next();
  },
);
