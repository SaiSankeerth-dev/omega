import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendPaginated, sendCreated } from '@omega/shared/response';

export const analyticsRouter = Router();

const trackSchema = z.object({
  body: z.object({
    event: z.string().min(1).max(200),
    properties: z.record(z.unknown()).optional(),
    page: z.string().max(500).optional(),
    sessionId: z.string().max(100).optional(),
  }),
});

// ── Track an event ─────────────────────────────────────────────────────
analyticsRouter.post(
  '/track',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = trackSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid event data' });
      return;
    }

    const { event, properties, page, sessionId } = parsed.data.body;

    await prisma.analyticsEvent.create({
      data: {
        userId: req.user!.userId,
        event,
        properties: properties as any ?? {},
        page: page ?? null,
        sessionId: sessionId ?? null,
      } as any,
    });

    sendCreated(res, { tracked: true });
  }),
);

// ── Get analytics dashboard data ───────────────────────────────────────
analyticsRouter.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalEvents, uniqueUsers, eventsByType, eventsByDay, topPages] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { createdAt: { gte: since } } as any,
      }),
      (prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since } } as any,
        _count: true,
      }) as any),
      (prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: { createdAt: { gte: since } } as any,
        _count: true,
        orderBy: { _count: { event: 'desc' } } as any,
        take: 10,
      } as any) as any),
      (prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: since } } as any,
        _count: true,
      } as any) as any),
      (prisma.analyticsEvent.groupBy({
        by: ['page'],
        where: {
          createdAt: { gte: since },
          page: { not: null },
        } as any,
        _count: true,
        orderBy: { _count: { page: 'desc' } } as any,
        take: 10,
      } as any) as any),
    ]);

    sendSuccess(res, {
      dashboard: {
        totalEvents,
        uniqueUsers: uniqueUsers.length,
        eventsByType: (eventsByType as any[]).map((e: any) => ({
          event: e.event,
          count: e._count,
        })),
        eventsByDay: (eventsByDay as any[]).slice(-30).map((e: any) => ({
          date: e.createdAt,
          count: e._count,
        })),
        topPages: (topPages as any[]).map((p: any) => ({
          page: p.page,
          views: p._count,
        })),
      },
    });
  }),
);

// ── Get project-specific analytics ─────────────────────────────────────
analyticsRouter.get(
  '/project/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const views = await prisma.analyticsEvent.count({
      where: {
        event: 'page_view',
        page: { contains: `/editor/${req.params.projectId}` },
      } as any,
    });

    const edits = await prisma.analyticsEvent.count({
      where: {
        event: 'document_edit',
        properties: { path: ['projectId'], equals: req.params.projectId },
      } as any,
    });

    sendSuccess(res, {
      analytics: {
        views,
        edits,
        exports: 0,
      },
    });
  }),
);
