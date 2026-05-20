import crypto from 'crypto';
import { prisma } from './prisma';
import { generateAccessToken, generateRefreshToken, verifyToken, type RefreshTokenPayload } from './token';

const REFRESH_TOKEN_DAYS = 7;

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createSessionTokens = async (user: { id: string; email: string }): Promise<SessionTokens> => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  const accessToken = generateAccessToken(user.id, user.email, session.id);
  const refreshToken = generateRefreshToken(user.id, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: { token: hashToken(refreshToken) },
  });

  return { accessToken, refreshToken, expiresAt };
};

export const rotateRefreshToken = async (refreshToken: string): Promise<SessionTokens & { user: { id: string; email: string; name: string | null; avatarUrl: string | null } }> => {
  const payload = verifyToken<RefreshTokenPayload>(refreshToken);
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
  });

  if (!session || session.userId !== payload.userId || session.expiresAt <= new Date()) {
    throw new Error('Invalid refresh token');
  }

  if (session.token !== hashToken(refreshToken)) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    throw new Error('Invalid refresh token');
  }

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  const nextAccessToken = generateAccessToken(session.user.id, session.user.email, session.id);
  const nextRefreshToken = generateRefreshToken(session.user.id, session.id);

  await prisma.session.update({
    where: { id: session.id },
    data: {
      token: hashToken(nextRefreshToken),
      expiresAt,
    },
  });

  return {
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    expiresAt,
    user: session.user,
  };
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
};

export const validateSession = async (sessionId: string, userId: string): Promise<boolean> => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  return !!session && session.userId === userId && session.expiresAt > new Date();
};
