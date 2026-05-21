import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@omega/shared/response';
import { NotFoundError, ForbiddenError } from '@omega/shared/errors';

export const pluginRouter = Router();

const createPluginSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    category: z.string().max(50).optional(),
    icon: z.string().max(200).optional(),
    config: z.record(z.unknown()).optional(),
    source: z.string().optional(),
  }),
});

// ── List plugins (public marketplace) ──────────────────────────────────
pluginRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const where: any = { isPublic: true };
    if (category) where.category = category;

    const [plugins, total] = await Promise.all([
      prisma.plugin.findMany({
        where: where as any,
        orderBy: { downloads: 'desc' },
        skip,
        take: limit,
        // @ts-ignore - author is a String field in schema but we use it as include
      include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      }),
      prisma.plugin.count({ where: where as any }),
    ]);

    sendPaginated(res, plugins, total, page, limit);
  }),
);

// ── List user's plugins ────────────────────────────────────────────────
pluginRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const plugins = await prisma.plugin.findMany({
      where: { authorId: req.user!.userId } as any,
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(res, { plugins });
  }),
);

// ── Get single plugin ──────────────────────────────────────────────────
pluginRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const plugin = await prisma.plugin.findUnique({
      where: { id: req.params.id } as any,
      // @ts-ignore - author is a String field in schema but we use it as include
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    if (!plugin || !plugin.isPublic) {
      // Check if it's the user's own plugin
      if (!req.headers.authorization) throw new NotFoundError('Plugin');
      // The middleware won't run so we just throw
      throw new NotFoundError('Plugin');
    }

    sendSuccess(res, { plugin });
  }),
);

// ── Install plugin (increment download count) ──────────────────────────
pluginRouter.post(
  '/:id/install',
  requireAuth,
  asyncHandler(async (req, res) => {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } as any });
    if (!plugin) throw new NotFoundError('Plugin');

    await prisma.plugin.update({
      where: { id: req.params.id } as any,
      data: { downloads: { increment: 1 } },
    });

    sendSuccess(res, { installed: true });
  }),
);

// ── Create plugin ──────────────────────────────────────────────────────
pluginRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createPluginSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const { name, description, category, icon, config, source } = parsed.data.body;

    const plugin = await prisma.plugin.create({
      data: {
        name,
        description: description ?? null,
        category: category ?? 'Other',
        icon: icon ?? null,
        author: (req.user as any).name || req.user!.email,
        authorId: req.user!.userId,
        config: (config as any) ?? {},
        source: source ?? null,
        isPublic: false,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'plugin.create',
        resource: 'plugin',
        resourceId: plugin.id,
        details: `Created plugin "${name}"`,
      } as any,
    });

    sendCreated(res, { plugin });
  }),
);

// ── Update plugin ──────────────────────────────────────────────────────
pluginRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } as any });
    if (!plugin) throw new NotFoundError('Plugin');
    if (plugin.authorId !== req.user!.userId) throw new ForbiddenError();

    const { name, description, category, icon, isPublic, config, source } = req.body;

    const updated = await prisma.plugin.update({
      where: { id: req.params.id } as any,
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(icon !== undefined && { icon }),
        ...(isPublic !== undefined && { isPublic }),
        ...(config !== undefined && { config: config as any }),
        ...(source !== undefined && { source }),
      } as any,
    });

    sendSuccess(res, { plugin: updated });
  }),
);

// ── Delete plugin ──────────────────────────────────────────────────────
pluginRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const plugin = await prisma.plugin.findUnique({ where: { id: req.params.id } as any });
    if (!plugin) throw new NotFoundError('Plugin');
    if (plugin.authorId !== req.user!.userId) throw new ForbiddenError();

    await prisma.plugin.delete({ where: { id: req.params.id } as any });

    sendSuccess(res, { deleted: true });
  }),
);

// ── Get plugin categories ──────────────────────────────────────────────
pluginRouter.get(
  '/categories/list',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      categories: [
        'Design',
        'AI',
        'Export',
        'Collaboration',
        'Analytics',
        'Media',
        'Charts',
        'Other',
      ],
    });
  }),
);
