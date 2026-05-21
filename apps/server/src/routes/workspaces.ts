import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated } from '@omega/shared/response';
import { NotFoundError, BadRequestError } from '@omega/shared/errors';

export const workspaceRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes').optional(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
  }),
});

// ── List user's workspaces ─────────────────────────────────────────────────
workspaceRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: req.user!.userId },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, { workspaces });
  }),
);

// ── Get single workspace ──────────────────────────────────────────────────
workspaceRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.params.id as string },
      include: { projects: { orderBy: { updatedAt: 'desc' }, take: 50 } },
    });

    if (!workspace || workspace.ownerId !== req.user!.userId) {
      throw new NotFoundError('Workspace');
    }

    sendSuccess(res, { workspace });
  }),
);

// ── Create workspace ──────────────────────────────────────────────────────
workspaceRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const { name, slug } = parsed.data.body;
    const finalSlug = slug ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${randomUUID().slice(0, 6)}`;

    const existing = await prisma.workspace.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      throw new BadRequestError('A workspace with this slug already exists');
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: finalSlug,
        ownerId: req.user!.userId,
      },
    });

    sendCreated(res, { workspace });
  }),
);

// ── Update workspace ──────────────────────────────────────────────────────
workspaceRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.workspace.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing || existing.ownerId !== req.user!.userId) {
      throw new NotFoundError('Workspace');
    }

    const parsed = updateSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const workspace = await prisma.workspace.update({
      where: { id: req.params.id as string },
      data: parsed.data.body,
    });

    sendSuccess(res, { workspace });
  }),
);

// ── Delete workspace ──────────────────────────────────────────────────────
workspaceRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const existing = await prisma.workspace.findUnique({
      where: { id: req.params.id as string },
    });

    if (!existing || existing.ownerId !== req.user!.userId) {
      throw new NotFoundError('Workspace');
    }

    await prisma.workspace.delete({ where: { id: req.params.id as string } });

    sendSuccess(res, { ok: true });
  }),
);
