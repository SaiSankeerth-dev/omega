// POST /api/ai/chat  — Server-Sent Events streaming chat
// Works with the existing Zustand ai store on the frontend.

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAIProvider } from '@omega/ai/providers';
import { PROMPTS } from '@omega/ai/prompts';

export const chatRouter = Router();

const BodySchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(10000),
  })).min(1).max(100),
  slideContext: z.string().max(5000).optional(),
  model: z.string().optional(),
});

chatRouter.post('/', async (req: Request, res: Response) => {
  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const { messages, slideContext, model } = parsed.data;
  const systemPrompt = slideContext ? PROMPTS.COPILOT(slideContext) : PROMPTS.CHAT;

  const aiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  // SSE headers — critical for Render (nginx) not to buffer the stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Keepalive ping every 15s so Render doesn't close idle connections
  const keepalive = setInterval(() => {
    if (!res.writableEnded) res.write(': ping\n\n');
  }, 15000);

  try {
    const provider = getAIProvider();
    for await (const chunk of provider.stream(aiMessages, { model })) {
      if (res.writableEnded) break;
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (chunk.done || chunk.error) break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stream failed';
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ delta: '', done: true, error: message })}\n\n`);
    }
  } finally {
    clearInterval(keepalive);
    if (!res.writableEnded) res.end();
  }
});
