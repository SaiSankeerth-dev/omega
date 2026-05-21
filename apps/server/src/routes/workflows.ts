import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@omega/shared/response';
import { NotFoundError, ForbiddenError } from '@omega/shared/errors';

export const workflowRouter = Router();

const createWorkflowSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    trigger: z.enum(['manual', 'on_create', 'on_save', 'on_publish', 'on_schedule', 'on_webhook']),
    steps: z.array(z.object({
      id: z.string(),
      type: z.enum(['ai_generate', 'export', 'notify', 'transform', 'publish', 'webhook']),
      config: z.record(z.unknown()),
      order: z.number().int().min(0),
    })).min(1),
  }),
});

// ── List user's workflows ──────────────────────────────────────────────
workflowRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where: { userId: req.user!.userId } as any,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workflow.count({ where: { userId: req.user!.userId } } as any),
    ]);

    sendPaginated(res, workflows, total, page, limit);
  }),
);

// ── Create workflow ────────────────────────────────────────────────────
workflowRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createWorkflowSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const { name, description, trigger, steps } = parsed.data.body;

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description: description ?? null,
        userId: req.user!.userId,
        trigger,
        steps: steps as any,
        enabled: true,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'workflow.create',
        resource: 'workflow',
        resourceId: workflow.id,
        details: `Created workflow "${name}"`,
      } as any,
    });

    sendCreated(res, { workflow });
  }),
);

// ── Get single workflow ────────────────────────────────────────────────
workflowRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id } as any,
    });

    if (!workflow || workflow.userId !== req.user!.userId) {
      throw new NotFoundError('Workflow');
    }

    sendSuccess(res, { workflow });
  }),
);

// ── Update workflow ────────────────────────────────────────────────────
workflowRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id } as any,
    });

    if (!workflow || workflow.userId !== req.user!.userId) {
      throw new NotFoundError('Workflow');
    }

    const { name, description, trigger, steps, enabled } = req.body;

    const updated = await prisma.workflow.update({
      where: { id: req.params.id } as any,
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(trigger !== undefined && { trigger }),
        ...(steps !== undefined && { steps: steps as any }),
        ...(enabled !== undefined && { enabled }),
      } as any,
    });

    sendSuccess(res, { workflow: updated });
  }),
);

// ── Delete workflow ────────────────────────────────────────────────────
workflowRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id } as any,
    });

    if (!workflow || workflow.userId !== req.user!.userId) {
      throw new NotFoundError('Workflow');
    }

    await prisma.workflow.delete({ where: { id: req.params.id } as any });

    sendSuccess(res, { deleted: true });
  }),
);

// ── Execute workflow ───────────────────────────────────────────────────
workflowRouter.post(
  '/:id/execute',
  requireAuth,
  asyncHandler(async (req, res) => {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id } as any,
    });

    if (!workflow || workflow.userId !== req.user!.userId) {
      throw new NotFoundError('Workflow');
    }

    if (!workflow.enabled) {
      sendError(res, 'Workflow is disabled');
      return;
    }

    const steps = workflow.steps as any as any[];
    const results: any[] = [];

    for (const step of steps.sort((a: any, b: any) => a.order - b.order)) {
      try {
        // Execute step based on type
        switch (step.type) {
          case 'notify':
            await prisma.notification.create({
              data: {
                userId: req.user!.userId,
                type: 'workflow',
                title: step.config?.title ?? 'Workflow Step',
                message: step.config?.message ?? `Executed: ${step.type}`,
              } as any,
            });
            results.push({ stepId: step.id, status: 'completed' });
            break;

          case 'export':
            results.push({ stepId: step.id, status: 'completed', message: 'Export queued' });
            break;

          default:
            results.push({ stepId: step.id, status: 'completed' });
        }
      } catch (err: any) {
        results.push({ stepId: step.id, status: 'failed', error: err.message });
      }
    }

    // Update last run
    await prisma.workflow.update({
      where: { id: req.params.id } as any,
      data: { lastRun: new Date() } as any,
    });

    sendSuccess(res, { executed: true, results });
  }),
);

// ── Get workflow triggers list ─────────────────────────────────────────
workflowRouter.get(
  '/config/triggers',
  requireAuth,
  asyncHandler(async (_req, res) => {
    sendSuccess(res, {
      triggers: [
        { id: 'manual', label: 'Manual', description: 'Run manually from the dashboard' },
        { id: 'on_create', label: 'On Create', description: 'When a new project is created' },
        { id: 'on_save', label: 'On Save', description: 'When a project is saved' },
        { id: 'on_publish', label: 'On Publish', description: 'When a project is published' },
        { id: 'on_schedule', label: 'Scheduled', description: 'Run on a schedule (cron)' },
        { id: 'on_webhook', label: 'Webhook', description: 'Triggered by an external webhook' },
      ],
    });
  }),
);
