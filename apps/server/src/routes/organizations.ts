import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendCreated, sendPaginated, sendError } from '@omega/shared/response';
import { NotFoundError, ForbiddenError } from '@omega/shared/errors';

export const orgRouter = Router();

const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  }),
});

const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    logoUrl: z.string().url().optional().nullable(),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
  }),
});

// ── List user's organizations ──────────────────────────────────────────
orgRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgs = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: req.user!.userId } as any,
          { members: { some: { userId: req.user!.userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, { organizations: orgs });
  }),
);

// ── Get single organization ────────────────────────────────────────────
orgRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id } as any,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: { select: { members: true, projects: true } },
      },
    });

    if (!org) throw new NotFoundError('Organization');

    // Check membership
    const isMember = org.ownerId === req.user!.userId ||
      org.members.some(m => m.userId === req.user!.userId);
    if (!isMember) throw new ForbiddenError();

    sendSuccess(res, { organization: org });
  }),
);

// ── Create organization ────────────────────────────────────────────────
orgRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createOrgSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const { name, slug } = parsed.data.body;

    // Check slug uniqueness
    const existing = await prisma.organization.findUnique({ where: { slug } as any });
    if (existing) {
      sendError(res, 'Organization slug already taken');
      return;
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        ownerId: req.user!.userId,
        members: {
          create: {
            userId: req.user!.userId,
            role: 'OWNER',
          },
        },
      } as any,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'org.create',
        resource: 'organization',
        resourceId: org.id,
        details: `Created organization "${name}"`,
      } as any,
    });

    sendCreated(res, { organization: org });
  }),
);

// ── Update organization ────────────────────────────────────────────────
orgRouter.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } as any });
    if (!org) throw new NotFoundError('Organization');
    if (org.ownerId !== req.user!.userId) throw new ForbiddenError();

    const parsed = updateOrgSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const updated = await prisma.organization.update({
      where: { id: req.params.id } as any,
      data: parsed.data.body as any,
    });

    sendSuccess(res, { organization: updated });
  }),
);

// ── Delete organization ────────────────────────────────────────────────
orgRouter.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } as any });
    if (!org) throw new NotFoundError('Organization');
    if (org.ownerId !== req.user!.userId) throw new ForbiddenError();

    await prisma.organization.delete({ where: { id: req.params.id } as any });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'org.delete',
        resource: 'organization',
        resourceId: org.id,
        details: `Deleted organization "${org.name}"`,
      } as any,
    });

    sendSuccess(res, { deleted: true });
  }),
);

// ── Add member to organization ─────────────────────────────────────────
orgRouter.post(
  '/:id/members',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } as any });
    if (!org) throw new NotFoundError('Organization');
    if (org.ownerId !== req.user!.userId) throw new ForbiddenError();

    const parsed = addMemberSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      sendError(res, parsed.error.errors[0]?.message ?? 'Invalid input');
      return;
    }

    const { email, role } = parsed.data.body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } } as any);
    if (!user) {
      sendError(res, 'User not found with that email');
      return;
    }

    // Check if already a member
    const existingMember = await prisma.orgMember.findFirst({
      where: { organizationId: org.id, userId: user.id } as any,
    });
    if (existingMember) {
      sendError(res, 'User is already a member');
      return;
    }

    const member = await prisma.orgMember.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        role: role as any,
      } as any,
    });

    // Create notification for new member
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'org_invite',
        title: `You've been invited to ${org.name}`,
        message: `You were added as a ${role.toLowerCase()} by ${req.user!.email}`,
        link: `/settings/organizations/${org.id}`,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'org.add_member',
        resource: 'organization',
        resourceId: org.id,
        details: `Added ${email} as ${role}`,
      } as any,
    });

    sendCreated(res, {
      member: {
        ...member,
        user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      },
    });
  }),
);

// ── Update member role ─────────────────────────────────────────────────
orgRouter.put(
  '/:id/members/:memberId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } as any });
    if (!org) throw new NotFoundError('Organization');
    if (org.ownerId !== req.user!.userId) throw new ForbiddenError();

    const { role } = req.body;
    if (!role || !['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      sendError(res, 'Valid role is required (ADMIN, EDITOR, VIEWER)');
      return;
    }

    const member = await prisma.orgMember.findFirst({
      where: { id: req.params.memberId, organizationId: org.id } as any,
    });
    if (!member) throw new NotFoundError('Member');

    const updated = await prisma.orgMember.update({
      where: { id: member.id } as any,
      data: { role: role as any },
    });

    sendSuccess(res, { member: updated });
  }),
);

// ── Remove member ──────────────────────────────────────────────────────
orgRouter.delete(
  '/:id/members/:memberId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const org = await prisma.organization.findUnique({ where: { id: req.params.id } as any });
    if (!org) throw new NotFoundError('Organization');
    if (org.ownerId !== req.user!.userId) throw new ForbiddenError();

    const member = await prisma.orgMember.findFirst({
      where: { id: req.params.memberId, organizationId: org.id } as any,
    });
    if (!member) throw new NotFoundError('Member');

    await prisma.orgMember.delete({ where: { id: member.id } as any });

    sendSuccess(res, { removed: true });
  }),
);
