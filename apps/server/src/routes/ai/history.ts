// Full CRUD for AIHistory — uses the existing Prisma AiHistory model.
// GET    /api/ai/history          — paginated list
// GET    /api/ai/history/:id      — single entry
// POST   /api/ai/history          — save generation
// DELETE /api/ai/history/:id      — delete

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

export const historyRouter = Router();

// GET /api/ai/history?page=1&limit=20&type=presentation
historyRouter.get('/', async (req: Request, res: Response) => {
  const { prisma, user } = req as any;
  const page  = Math.max(1, Number(req.query['page']) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query['limit']) || 20));
  const type  = req.query['type'] as string | undefined;

  const where = { userId: user.id, ...(type ? { type } : {}) };
  const [items, total] = await Promise.all([
    prisma.aIHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, type: true, prompt: true, model: true, createdAt: true },
    }),
    prisma.aIHistory.count({ where }),
  ]);

  res.json({ success: true, data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// GET /api/ai/history/:id
historyRouter.get('/:id', async (req: Request, res: Response) => {
  const { prisma, user } = req as any;
  const item = await prisma.aIHistory.findFirst({ where: { id: req.params['id'], userId: user.id } });
  if (!item) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  res.json({ success: true, data: item });
});

// POST /api/ai/history
const SaveSchema = z.object({
  type:      z.enum(['chat', 'presentation', 'copilot', 'animate', 'improve', 'generate', 'rewrite', 'expand', 'shorten', 'improve_writing', 'summarize', 'create_section', 'bullet_points']),
  prompt:    z.string().min(1).max(2000),
  response:  z.string().min(1),
  model:     z.string().optional(),
  projectId: z.string().optional(),
  tokens:    z.number().int().optional(),
});

historyRouter.post('/', async (req: Request, res: Response) => {
  const { prisma, user } = req as any;
  const parsed = SaveSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: parsed.error.errors[0]?.message }); return; }

  const item = await prisma.aIHistory.create({ data: { ...parsed.data, userId: user.id } });
  res.status(201).json({ success: true, data: item });
});

// DELETE /api/ai/history/:id
historyRouter.delete('/:id', async (req: Request, res: Response) => {
  const { prisma, user } = req as any;
  const item = await prisma.aIHistory.findFirst({ where: { id: req.params['id'], userId: user.id } });
  if (!item) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  await prisma.aIHistory.delete({ where: { id: req.params['id'] } });
  res.json({ success: true });
});
