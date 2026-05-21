import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendPaginated, sendSuccess } from '@omega/shared/response';

export const auditRouter = Router();

// ── List audit logs (admin only) ───────────────────────────────────────
auditRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Only allow admins to see all logs
    if (req.user!.role !== 'ADMIN') {
      // Users can see their own logs
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId: req.user!.userId } as any,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.auditLog.count({ where: { userId: req.user!.userId } } as any),
      ]);

      sendPaginated(res, logs, total, page, limit);
      return;
    }

    // Admin: filterable
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.action) where.action = req.query.action;
    if (req.query.resource) where.resource = req.query.resource;
    if (req.query.userId) where.userId = req.query.userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        } as any,
      } as any),
      prisma.auditLog.count({ where: where as any }),
    ]);

    sendPaginated(res, logs, total, page, limit);
  }),
);

// ── Get audit log stats ────────────────────────────────────────────────
auditRouter.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Admin only' });
      return;
    }

    const [totalLogs, uniqueActions, logsByDay] = await Promise.all([
      prisma.auditLog.count(),
      (prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
      } as any) as any),
      (prisma.auditLog.groupBy({
        by: ['createdAt'],
        _count: true,
      } as any) as any),
    ]);

    sendSuccess(res, {
      stats: {
        total: totalLogs,
        actionBreakdown: (uniqueActions as any[]).map((a: any) => ({ action: a.action, count: a._count })),
        recentActivity: (logsByDay as any[]).slice(-30),
      },
    });
  }),
);
