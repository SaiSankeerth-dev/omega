import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '@omega/shared/response';
import { BadRequestError, NotFoundError } from '@omega/shared/errors';
import { logger } from '@omega/shared/logger';

export const projectRouter = Router();

/* ─── Validation schemas ─────────────────────────────────────────────────── */

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(120),
  description: z.string().max(500).optional(),
  workspaceId: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
});

const saveDocumentSchema = z.object({
  content: z.record(z.unknown()),
});

/* ─── GET /projects ──────────────────────────────────────────────────────── */

projectRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { documents: true } },
      },
    });

    sendSuccess(res, { projects });
  }),
);

/* ─── POST /projects ─────────────────────────────────────────────────────── */

projectRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const parsed = createProjectSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const { name, description, workspaceId } = parsed.data;

    // Verify workspace ownership if provided
    if (workspaceId) {
      const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!ws || ws.ownerId !== userId) {
        throw new BadRequestError('Invalid workspace');
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId,
        workspaceId,
        documents: {
          create: {
            content: { blocks: [] },
            version: 1,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('Projects', `Created project "${name}" for user ${userId}`);
    sendSuccess(res, { project }, 201);
  }),
);

/* ─── GET /projects/:id ──────────────────────────────────────────────────── */

projectRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) throw new NotFoundError('Project not found');

    sendSuccess(res, { project });
  }),
);

/* ─── PATCH /projects/:id ────────────────────────────────────────────────── */

projectRouter.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError('Project not found');

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        description: true,
        workspaceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, { project });
  }),
);

/* ─── DELETE /projects/:id ───────────────────────────────────────────────── */

projectRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundError('Project not found');

    // Cascade: delete documents and AI history first (Prisma handles this via schema relations)
    await prisma.project.delete({ where: { id } });

    logger.info('Projects', `Deleted project ${id} for user ${userId}`);
    sendSuccess(res, { ok: true });
  }),
);

/* ─── GET /projects/:id/document ─────────────────────────────────────────── */

projectRouter.get(
  '/:id/document',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new NotFoundError('Project not found');

    const document = await prisma.editorDocument.findFirst({
      where: { projectId: id },
      orderBy: { version: 'desc' },
    });

    sendSuccess(res, { document });
  }),
);

/* ─── PUT /projects/:id/document ─────────────────────────────────────────── */

projectRouter.put(
  '/:id/document',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const parsed = saveDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid content');
    }

    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) throw new NotFoundError('Project not found');

    // Upsert the latest document version
    const existing = await prisma.editorDocument.findFirst({
      where: { projectId: id },
      orderBy: { version: 'desc' },
    });

    let document;
    if (existing) {
      document = await prisma.editorDocument.update({
        where: { id: existing.id },
        data: { content: parsed.data.content },
      });
    } else {
      document = await prisma.editorDocument.create({
        data: { projectId: id, content: parsed.data.content, version: 1 },
      });
    }

    // Bump project updatedAt
    await prisma.project.update({ where: { id }, data: { updatedAt: new Date() } });

    sendSuccess(res, { document });
  }),
);
