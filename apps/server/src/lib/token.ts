import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY } from '@omega/shared/constants';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

const secret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error('JWT_SECRET is not set');
  }
  return s;
};

export const generateAccessToken = (userId: string, email: string, sessionId: string): string =>
  jwt.sign({ userId, email, sessionId }, secret(), { expiresIn: TOKEN_EXPIRY.ACCESS });

export const generateRefreshToken = (userId: string, sessionId: string): string =>
  jwt.sign({ userId, sessionId }, secret(), { expiresIn: TOKEN_EXPIRY.REFRESH });

export const verifyToken = <T>(token: string): T =>
  jwt.verify(token, secret()) as T;
