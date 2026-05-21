import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { sendSuccess } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

export const editorRouter = Router();

const updateSchema = z.object({
  body: z.object({
    content: z.record(z.unknown()),
    version: z.number().int().positive().optional(),
  }),
});

// ── Get editor document for a project ────────────────────────────────────
editorRouter.get(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId as string },
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    let doc = await prisma.editorDocument.findFirst({
      where: { projectId: req.params.projectId as string },
    });

    if (!doc) {
      doc = await prisma.editorDocument.create({
        data: {
          projectId: req.params.projectId as string,
          content: {
            blocks: [
              { id: '1', type: 'heading', content: 'Untitled' },
              { id: '2', type: 'text', content: 'Start editing...' },
            ],
          } as InputJsonValue,
          version: 1,
        },
      });
    }

    sendSuccess(res, { document: doc });
  }),
);

// ── Update editor document ──────────────────────────────────────────────
editorRouter.put(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = updateSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId as string },
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const { content, version } = parsed.data.body;

    const existing = await prisma.editorDocument.findFirst({
      where: { projectId: req.params.projectId as string },
    });

    let doc;
    if (existing) {
      if (version !== undefined && version !== existing.version) {
        res.status(409).json({
          success: false,
          code: 'CONFLICT',
          error: 'Document was modified by another user. Please refresh.',
        });
        return;
      }

      doc = await prisma.editorDocument.update({
        where: { id: existing.id },
        data: {
          content: content as InputJsonValue,
          version: { increment: 1 },
        },
      });
    } else {
      doc = await prisma.editorDocument.create({
        data: {
          projectId: req.params.projectId as string,
          content: content as InputJsonValue,
          version: 1,
        },
      });
    }

    // Also update project's updatedAt
    await prisma.project.update({
      where: { id: req.params.projectId as string },
      data: { updatedAt: new Date() },
    });

    sendSuccess(res, { document: doc });
  }),
);
