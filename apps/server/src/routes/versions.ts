import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendPaginated, sendCreated } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

export const versionRouter = Router();

const createVersionSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    message: z.string().max(500).optional(),
    content: z.record(z.unknown()),
  }),
});

// ── List versions for a project ────────────────────────────────────────
versionRouter.get(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId } as any,
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const [versions, total] = await Promise.all([
      prisma.documentVersion.findMany({
        where: { projectId: req.params.projectId } as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.documentVersion.count({
        where: { projectId: req.params.projectId } as any,
      }),
    ]);

    sendPaginated(res, versions, total, page, limit);
  }),
);

// ── Create a version snapshot ──────────────────────────────────────────
versionRouter.post(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createVersionSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId } as any,
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const { title, message, content } = parsed.data.body;

    // Get latest version number
    const latest = await prisma.documentVersion.findFirst({
      where: { projectId: req.params.projectId } as any,
      orderBy: { version: 'desc' },
    });

    const version = await prisma.documentVersion.create({
      data: {
        projectId: req.params.projectId,
        content: content as any,
        version: (latest?.version ?? 0) + 1,
        title,
        message: message ?? '',
        userId: req.user!.userId,
      } as any,
    });

    // Update editor document version
    await prisma.editorDocument.updateMany({
      where: { projectId: req.params.projectId } as any,
      data: { version: (latest?.version ?? 0) + 1 } as any,
    });

    sendCreated(res, { version });
  }),
);

// ── Get a specific version ─────────────────────────────────────────────
versionRouter.get(
  '/:projectId/:versionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: req.params.versionId,
        projectId: req.params.projectId,
      } as any,
    });

    if (!version) {
      throw new NotFoundError('Version');
    }

    sendSuccess(res, { version });
  }),
);

// ── Restore a version ──────────────────────────────────────────────────
versionRouter.post(
  '/:projectId/:versionId/restore',
  requireAuth,
  asyncHandler(async (req, res) => {
    const version = await prisma.documentVersion.findFirst({
      where: {
        id: req.params.versionId,
        projectId: req.params.projectId,
      } as any,
    });

    if (!version) {
      throw new NotFoundError('Version');
    }

    // Restore content to editor document
    await prisma.editorDocument.updateMany({
      where: { projectId: req.params.projectId } as any,
      data: {
        content: version.content as any,
        version: version.version,
      } as any,
    });

    sendSuccess(res, { restored: true, version });
  }),
);
