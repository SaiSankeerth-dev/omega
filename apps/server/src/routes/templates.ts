import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import type { InputJsonValue } from '@prisma/client/runtime/library';
import { sendSuccess, sendCreated, sendPaginated } from '@omega/shared/response';

export const templateRouter = Router();

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    description: z.string().max(1000).optional(),
    content: z.record(z.unknown()),
    isPublic: z.boolean().default(false),
  }),
});

// ── List templates (public + user's own) ─────────────────────────────────
templateRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const where: Record<string, unknown> = { isPublic: true };
    if (category && category !== 'All') {
      where.category = category;
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.template.count({ where }),
    ]);

    sendPaginated(res, templates, total, page, limit);
  }),
);

// ── Get single template ─────────────────────────────────────────────────
templateRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id as string },
    });

    if (!template || (!template.isPublic && template.userId !== req.user?.userId)) {
      res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        error: 'Template not found.',
      });
      return;
    }

    sendSuccess(res, { template });
  }),
);

// ── Create template ─────────────────────────────────────────────────────
templateRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      });
      return;
    }

    const { name, description, content, isPublic } = parsed.data.body;

    const template = await prisma.template.create({
      data: {
        name,
        description: description ?? null,
        content: content as InputJsonValue,
        isPublic,
        userId: req.user!.userId,
      },
    });

    sendCreated(res, { template });
  }),
);

// ── Seed default templates ──────────────────────────────────────────────
templateRouter.post(
  '/seed',
  asyncHandler(async (_req, res) => {
    const count = await prisma.template.count();
    if (count > 0) {
      res.status(200).json({ message: 'Templates already seeded', count });
      return;
    }

    const defaultTemplates = [
      {
        name: 'Pitch Deck Pro',
        description: 'Investor-ready pitch deck with modern layout',
        category: 'Presentations',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Pitch Deck Pro' },
            { id: '2', type: 'text', content: 'A compelling pitch deck template for startups seeking investment.' },
            { id: '3', type: 'image', content: '' },
          ],
        },
      },
      {
        name: 'SaaS Landing Page',
        description: 'High-converting landing page for startups',
        category: 'Websites',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'SaaS Landing Page' },
            { id: '2', type: 'text', content: 'A modern, conversion-optimized landing page template.' },
          ],
        },
      },
      {
        name: 'Brand Story',
        description: 'Tell your brand story with cinematic visuals',
        category: 'Presentations',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Brand Story' },
            { id: '2', type: 'text', content: 'A cinematic brand storytelling template.' },
          ],
        },
      },
      {
        name: 'Product Roadmap',
        description: 'Visual roadmap for product planning',
        category: 'Documents',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Product Roadmap' },
            { id: '2', type: 'text', content: 'A visual product roadmap template for planning.' },
          ],
        },
      },
      {
        name: 'Startup One-Pager',
        description: 'Clean one-page summary for your startup',
        category: 'Documents',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Startup One-Pager' },
            { id: '2', type: 'text', content: 'A concise one-page startup summary template.' },
          ],
        },
      },
      {
        name: 'Agency Portfolio',
        description: 'Full agency portfolio with case studies',
        category: 'Portfolios',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Agency Portfolio' },
            { id: '2', type: 'text', content: 'A professional portfolio template for creative agencies.' },
          ],
        },
      },
      {
        name: 'Investor Memo',
        description: 'Professional investor memorandum',
        category: 'Documents',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Investor Memo' },
            { id: '2', type: 'text', content: 'A professional investor memorandum template.' },
          ],
        },
      },
      {
        name: 'Social Media Kit',
        description: 'Branded social media graphics pack',
        category: 'Presentations',
        isPublic: true,
        content: {
          blocks: [
            { id: '1', type: 'heading', content: 'Social Media Kit' },
            { id: '2', type: 'text', content: 'A branded social media graphics template pack.' },
          ],
        },
      },
    ];

    // Use a system seed ID if no admin user exists
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const seedUserId = adminUser?.id ?? 'seed-system';

    for (const tmpl of defaultTemplates) {
      await prisma.template.create({
        data: {
          name: tmpl.name,
          description: tmpl.description,
          category: tmpl.category,
          isPublic: tmpl.isPublic,
          content: tmpl.content as InputJsonValue,
          userId: seedUserId,
        },
      });
    }

    sendSuccess(res, { message: 'Templates seeded successfully', count: defaultTemplates.length });
  }),
);
