import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateAccessToken, verifyToken } from '../lib/token';
import { ConflictError, UnauthorizedError, BadRequestError } from '@omega/shared/errors';
import { sendSuccess } from '@omega/shared/response';
import { logger } from '@omega/shared/logger';
import bcrypt from 'bcryptjs';

export const authRouter = Router();

const SALT_ROUNDS = 12;

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

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      throw new BadRequestError(firstError?.message ?? 'Invalid input');
    }

    const { email, password, name } = parsed.data.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'This email is already registered. Try signing in instead.' },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const token = generateAccessToken(user.id, user.email);

    logger.info('Auth', `User registered: ${user.email}`);

    sendSuccess(res, {
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    }, 201);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new BadRequestError('Invalid email or password');
    }

    const { email, password } = parsed.data.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateAccessToken(user.id, user.email);

    logger.info('Auth', `User logged in: ${user.email}`);

    sendSuccess(res, {
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
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
    if (!token) throw new UnauthorizedError('No token provided');

    const payload = verifyToken<{ userId: string; email: string }>(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });

    if (!user) throw new UnauthorizedError('User not found');

    sendSuccess(res, { user });
  }),
);
