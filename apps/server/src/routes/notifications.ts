import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { sendSuccess, sendPaginated } from '@omega/shared/response';

export const notificationRouter = Router();

// In-memory notification store for now
// In production, use a proper notification system with DB persistence
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const notifications = new Map<string, Notification[]>();

// ── List notifications ────────────────────────────────────────────────────
notificationRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const userNotifications = notifications.get(req.user!.userId) || [];
    const sorted = [...userNotifications].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginated = sorted.slice(skip, skip + limit);

    sendPaginated(res, paginated, sorted.length, page, limit);
  }),
);

// ── Get unread count ──────────────────────────────────────────────────────
notificationRouter.get(
  '/unread/count',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userNotifications = notifications.get(req.user!.userId) || [];
    const unread = userNotifications.filter((n) => !n.read).length;

    sendSuccess(res, { count: unread });
  }),
);

// ── Mark notification as read ─────────────────────────────────────────────
notificationRouter.put(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userNotifications = notifications.get(req.user!.userId) || [];
    const notification = userNotifications.find((n) => n.id === req.params.id);

    if (notification) {
      notification.read = true;
    }

    sendSuccess(res, { ok: true });
  }),
);

// ── Mark all as read ──────────────────────────────────────────────────────
notificationRouter.put(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userNotifications = notifications.get(req.user!.userId) || [];
    for (const n of userNotifications) {
      n.read = true;
    }

    sendSuccess(res, { ok: true });
  }),
);

// ── Helper to add notifications (used by other services) ──────────────────
export function addNotification(userId: string, type: Notification['type'], title: string, message: string): void {
  if (!notifications.has(userId)) {
    notifications.set(userId, []);
  }
  notifications.get(userId)!.push({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date(),
  });
}
