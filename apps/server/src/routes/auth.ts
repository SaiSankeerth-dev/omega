import { Router } from 'express';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../middleware/asyncHandler';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyToken, type AccessTokenPayload } from '../lib/token';
import { createSessionTokens, deleteSession, rotateRefreshToken } from '../lib/sessions';
import { hashPassword, verifyPassword } from '../lib/password';
import { UnauthorizedError, BadRequestError } from '@omega/shared/errors';
import { sendSuccess } from '@omega/shared/response';
import { logger } from '@omega/shared/logger';

export const authRouter = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const userPayload = (user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl ?? null,
  ...(user.createdAt && { createdAt: user.createdAt }),
  ...(user.updatedAt && { updatedAt: user.updatedAt }),
});

const defaultWorkspaceSlug = (email: string): string =>
  `${email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'workspace'}-${randomUUID().slice(0, 8)}`;

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new BadRequestError(firstError?.message ?? 'Invalid input');
    }

    const { password, name } = parsed.data.body;
    const email = parsed.data.body.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'This email is already registered. Try signing in instead.' },
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        workspaces: {
          create: {
            name: `${name}'s Workspace`,
            slug: defaultWorkspaceSlug(email),
          },
        },
      },
    });

    const tokens = await createSessionTokens(user);

    logger.info('Auth', `User registered: ${user.email}`);

    sendSuccess(res, {
      user: userPayload(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    }, 201);
    return;
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new BadRequestError(firstError?.message ?? 'Invalid input');
    }

    const email = parsed.data.body.email.toLowerCase().trim();
    const { password } = parsed.data.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await createSessionTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info('Auth', `User logged in: ${user.email}`);

    sendSuccess(res, {
      user: userPayload(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
    return;
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const parsed = refreshSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    try {
      const tokens = await rotateRefreshToken(parsed.data.body.refreshToken);
      sendSuccess(res, {
        user: userPayload(tokens.user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (token) {
      try {
        const payload = verifyToken<AccessTokenPayload>(token);
        await deleteSession(payload.sessionId);
      } catch {
        // Logout remains idempotent.
      }
    }

    sendSuccess(res, { ok: true });
  }),
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const payload = verifyToken<AccessTokenPayload>(token);
    const session = await prisma.session.findUnique({ where: { id: payload.sessionId } });

    if (!session || session.userId !== payload.userId || session.expiresAt <= new Date()) {
      throw new UnauthorizedError('Session expired or revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    sendSuccess(res, { user: userPayload(user) });
  }),
);
