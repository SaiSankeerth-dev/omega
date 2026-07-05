// apps/server/src/routes/ai/index.ts
// Drop-in replacement for the existing apps/server/src/routes/ai.ts

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';
import { getAIProvider } from '@omega/ai/providers';
import { PROMPTS } from '@omega/ai/prompts';
import { chatRouter } from './chat.js';
import { presentationsRouter } from './presentations.js';
import { historyRouter } from './history.js';

export const aiRouter = Router();

// Auth on all routes
aiRouter.use(requireAuth);

// Sub-routers
aiRouter.use('/chat',          chatRouter);
aiRouter.use('/presentations', presentationsRouter);
aiRouter.use('/history',       historyRouter);

// Backwards-compatible content actions schema
const ContentActionSchema = z.object({
  action:  z.enum(['generate', 'rewrite', 'expand', 'shorten', 'improve_writing', 'summarize', 'create_section', 'bullet_points']),
  content: z.string().min(1).max(10000),
  context: z.string().max(2000).optional(),
});

// POST /api/ai/generate  (non-streaming, backwards compatible)
aiRouter.post('/generate', async (req, res) => {
  const parsed = ContentActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }
  const { action, content, context } = parsed.data;
  try {
    const provider = getAIProvider();
    const messages = [
      { role: 'system' as const, content: PROMPTS.ACTION_SYSTEM(action) },
      { role: 'user'   as const, content: context ? `Context:\n${context}\n\nContent:\n${content}` : content },
    ];
    // Use retry wrapper to improve resiliency on transient errors
    const { callWithRetries } = await import('@omega/ai/providers/common.js');
    const response = await callWithRetries(() => provider.generate(messages, { temperature: 0.7, maxTokens: 2048 }), 3, 300);
    res.json({ success: true, data: { content: response, action } });
  } catch (err) {
    res.status(502).json({ success: false, error: err instanceof Error ? err.message : 'Generation failed' });
  }
});

// POST /api/ai/generate/stream  (SSE, backwards compatible)
aiRouter.post('/generate/stream', async (req, res) => {
  const parsed = ContentActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }
  const { action, content, context } = parsed.data;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const keepalive = setInterval(() => { if (!res.writableEnded) res.write(': ping\n\n'); }, 15000);

  try {
    const provider = getAIProvider();
    const messages = [
      { role: 'system' as const, content: PROMPTS.ACTION_SYSTEM(action) },
      { role: 'user'   as const, content: context ? `Context:\n${context}\n\nContent:\n${content}` : content },
    ];
    // Stream directly; if stream fails, fall back to a retried generate call
    try {
      for await (const chunk of provider.stream(messages, { temperature: 0.7 })) {
        if (res.writableEnded) break;
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        if (chunk.done || chunk.error) break;
      }
    } catch (streamErr) {
      // Attempt a retried generate as fallback
      const { callWithRetries } = await import('@omega/ai/providers/common.js');
      const fallback = await callWithRetries(() => provider.generate(messages, { temperature: 0.7, maxTokens: 2048 }), 2, 500);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ delta: fallback, done: true })}\n\n`);
      }
    }
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ delta: '', done: true, error: err instanceof Error ? err.message : 'Stream failed' })}\n\n`);
    }
  } finally {
    clearInterval(keepalive);
    if (!res.writableEnded) res.end();
  }
});
