import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateAccessToken } from '../lib/token';
import { ConflictError, UnauthorizedError, BadRequestError } from '@omega/shared/errors';
import { sendSuccess } from '@omega/shared/response';
import { logger } from '@omega/shared/logger';
import crypto from 'crypto';

export const authRouter = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

// Simple password hashing using Node crypto (no external dep needed)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt!, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new BadRequestError('Invalid input');

    const { email, password, name } = parsed.data.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    const token = generateAccessToken(user.id, user.email);

    logger.info('Auth', `User registered: ${user.email}`);

    sendSuccess(res, { user: { id: user.id, email: user.email, name: user.name }, token }, 201);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse({ body: req.body });
    if (!parsed.success) throw new BadRequestError('Invalid input');

    const { email, password } = parsed.data.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new UnauthorizedError('Invalid credentials');

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const token = generateAccessToken(user.id, user.email);

    logger.info('Auth', `User logged in: ${user.email}`);

    sendSuccess(res, { user: { id: user.id, email: user.email, name: user.name }, token });
  }),
);
