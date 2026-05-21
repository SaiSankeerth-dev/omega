import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendPaginated } from '@omega/shared/response';

export const searchRouter = Router();

const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    type: z.enum(['all', 'presentation', 'website', 'document', 'story']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

// ── Search projects ────────────────────────────────────────────────────────
searchRouter.get(
  '/projects',
  requireAuth,
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) || '';
    const type = req.query.type as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId: req.user!.userId,
      ...(q && {
        name: { contains: q, mode: 'insensitive' } as Record<string, unknown>,
      }),
      ...(type && type !== 'all' && { type }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    sendPaginated(res, projects, total, page, limit);
  }),
);
