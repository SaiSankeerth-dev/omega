import jwt from 'jsonwebtoken';
import { TOKEN_EXPIRY } from '@omega/shared/constants';

const secret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return s;
};

export const generateAccessToken = (userId: string, email: string): string =>
  jwt.sign({ userId, email }, secret(), { expiresIn: TOKEN_EXPIRY.ACCESS });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, secret(), { expiresIn: TOKEN_EXPIRY.REFRESH });

export const verifyToken = <T>(token: string): T =>
  jwt.verify(token, secret()) as T;
