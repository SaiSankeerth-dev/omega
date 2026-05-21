import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { sendSuccess, sendCreated, sendPaginated } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

export const projectRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    type: z.enum(['presentation', 'website', 'document', 'story']).default('presentation'),
  }),
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
  }),
});

// ── List user's projects ─────────────────────────────────────────────────
projectRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: req.user!.userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: { userId: req.user!.userId } }),
    ]);

    sendPaginated(res, projects, total, page, limit);
  }),
);

// ── Get single project ──────────────────────────────────────────────────
projectRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id as string },
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    sendSuccess(res, { project });
  }),
);

// ── Create project ──────────────────────────────────────────────────────
projectRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      if (!firstError) {
        throw new NotFoundError('Invalid input');
      }
      throw new NotFoundError(firstError.message);
    }

    const { name, description, type } = parsed.data.body;

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        type,
        userId: req.user!.userId,
        documents: {
          create: {
            content: {
              blocks: [
                { id: '1', type: 'heading', content: name || 'Untitled Project' },
                { id: '2', type: 'text', content: 'Start editing your content here...' },
              ],
            } as InputJsonValue,
          },
        },
      },
    });

    sendCreated(res, { project });
  }),
);

// ── Update project ──────────────────────────────────────────────────────
projectRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing || existing.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const parsed = updateSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new NotFoundError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const project = await prisma.project.update({
      where: { id: req.params.id as string },
      data: parsed.data.body,
    });

    sendSuccess(res, { project });
  }),
);

// ── Delete project ──────────────────────────────────────────────────────
projectRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.project.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing || existing.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    await prisma.project.delete({ where: { id: req.params.id as string } });

    sendSuccess(res, { ok: true });
  }),
);
