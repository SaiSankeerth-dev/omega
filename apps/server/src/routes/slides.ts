import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendError } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

export const slideRouter = Router();

const createSlideSchema = z.object({
  body: z.object({
    title: z.string().max(200).optional().default('Untitled Slide'),
    content: z.record(z.unknown()).optional().default({}),
    order: z.number().int().min(0).optional(),
    transition: z.string().optional().default('fade'),
    duration: z.number().int().min(0).optional().default(0),
  }),
});

// ── Get all slides for a project ───────────────────────────────────────
slideRouter.get(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId } as any,
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const slides = await prisma.slide.findMany({
      where: { projectId: req.params.projectId } as any,
      orderBy: { order: 'asc' },
    });

    sendSuccess(res, { slides });
  }),
);

// ── Create a slide ─────────────────────────────────────────────────────
slideRouter.post(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSlideSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId } as any,
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const { title, content, order, transition, duration } = parsed.data.body;

    // Auto-assign order if not provided
    let slideOrder = order;
    if (slideOrder === undefined) {
      const lastSlide = await prisma.slide.findFirst({
        where: { projectId: req.params.projectId } as any,
        orderBy: { order: 'desc' },
      });
      slideOrder = (lastSlide?.order ?? -1) + 1;
    }

    const slide = await prisma.slide.create({
      data: {
        projectId: req.params.projectId,
        title,
        content: content as any,
        order: slideOrder,
        transition,
        duration,
      } as any,
    });

    sendCreated(res, { slide });
  }),
);

// ── Update a slide ─────────────────────────────────────────────────────
slideRouter.put(
  '/:projectId/:slideId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const slide = await prisma.slide.findFirst({
      where: { id: req.params.slideId, projectId: req.params.projectId } as any,
    });

    if (!slide) throw new NotFoundError('Slide');

    const { title, content, order, transition, duration } = req.body;

    const updated = await prisma.slide.update({
      where: { id: req.params.slideId } as any,
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content: content as any }),
        ...(order !== undefined && { order }),
        ...(transition !== undefined && { transition }),
        ...(duration !== undefined && { duration }),
      } as any,
    });

    sendSuccess(res, { slide: updated });
  }),
);

// ── Delete a slide ─────────────────────────────────────────────────────
slideRouter.delete(
  '/:projectId/:slideId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const slide = await prisma.slide.findFirst({
      where: { id: req.params.slideId, projectId: req.params.projectId } as any,
    });

    if (!slide) throw new NotFoundError('Slide');

    await prisma.slide.delete({ where: { id: req.params.slideId } as any });

    // Re-order remaining slides
    const remaining = await prisma.slide.findMany({
      where: { projectId: req.params.projectId } as any,
      orderBy: { order: 'asc' },
    });

    await Promise.all(remaining.map((slide, i) => {
      if (slide.order !== i) {
        return prisma.slide.update({
          where: { id: slide.id } as any,
          data: { order: i },
        });
      }
      return Promise.resolve();
    }));

    sendSuccess(res, { deleted: true });
  }),
);

// ── Reorder slides ─────────────────────────────────────────────────────
slideRouter.put(
  '/:projectId/reorder',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      sendError(res, 'Order must be an array of slide IDs');
      return;
    }

    for (let i = 0; i < order.length; i++) {
      await prisma.slide.updateMany({
        where: { id: order[i], projectId: req.params.projectId } as any,
        data: { order: i } as any,
      });
    }

    sendSuccess(res, { reordered: true });
  }),
);
