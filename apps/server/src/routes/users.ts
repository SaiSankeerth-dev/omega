import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '@omega/shared/errors';
import { sendSuccess } from '@omega/shared/response';

export const userRouter = Router();

userRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });

    if (!user) throw new NotFoundError('User');

    sendSuccess(res, { user });
  }),
);

userRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    });

    if (!user) throw new NotFoundError('User');

    sendSuccess(res, { user });
  }),
);
