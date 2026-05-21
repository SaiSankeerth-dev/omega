import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated } from '@omega/shared/response';
import { NotFoundError, BadRequestError } from '@omega/shared/errors';

export const shareRouter = Router();

const createShareSchema = z.object({
  body: z.object({
    projectId: z.string().min(1),
    permission: z.enum(['view', 'edit']).default('view'),
    expiresInDays: z.number().int().positive().max(365).optional(),
  }),
});

// In-memory share store (in production, use DB-backed shares)
interface ShareLink {
  token: string;
  projectId: string;
  ownerId: string;
  permission: 'view' | 'edit';
  createdAt: Date;
  expiresAt: Date | null;
}

const shares = new Map<string, ShareLink>();

// ── Create share link ─────────────────────────────────────────────────────
shareRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createShareSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const { projectId, permission, expiresInDays } = parsed.data.body;

    // Verify the project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const token = `omega-share-${randomUUID().slice(0, 12)}`;
    const now = new Date();

    shares.set(token, {
      token,
      projectId,
      ownerId: req.user!.userId,
      permission,
      createdAt: now,
      expiresAt: expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    });

    sendCreated(res, {
      shareLink: {
        token,
        url: `/shared/${token}`,
        permission,
        expiresAt: expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null,
      },
    });
  }),
);

// ── List shares for a project ─────────────────────────────────────────────
shareRouter.get(
  '/project/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const projectShares = Array.from(shares.values())
      .filter((s) => s.projectId === projectId && s.ownerId === req.user!.userId)
      .map(({ token, permission, createdAt, expiresAt }) => ({
        token,
        url: `/shared/${token}`,
        permission,
        createdAt,
        expiresAt,
        active: !expiresAt || expiresAt > new Date(),
      }));

    sendSuccess(res, { shares: projectShares });
  }),
);

// ── Revoke share link ─────────────────────────────────────────────────────
shareRouter.delete(
  '/:token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.params.token as string;
    const share = shares.get(token);

    if (!share || share.ownerId !== req.user!.userId) {
      throw new NotFoundError('Share link');
    }

    shares.delete(token);
    sendSuccess(res, { ok: true });
  }),
);

// ── Access shared project (public endpoint) ───────────────────────────────
shareRouter.get(
  '/access/:token',
  asyncHandler(async (req, res) => {
    const token = req.params.token as string;
    const share = shares.get(token);

    if (!share) {
      throw new NotFoundError('Shared project');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      shares.delete(token);
      throw new NotFoundError('Share link has expired');
    }

    const project = await prisma.project.findUnique({
      where: { id: share.projectId as string },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    sendSuccess(res, {
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        permission: share.permission,
      },
    });
  }),
);
