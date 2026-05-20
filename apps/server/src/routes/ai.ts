import { Router } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '@omega/shared/response';
import { BadRequestError } from '@omega/shared/errors';
import { logger } from '@omega/shared/logger';

export const aiRouter = Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-opus-4-5';
const MAX_TOKENS = 1024;

/* ─── Schemas ────────────────────────────────────────────────────────────── */

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(4000),
  action: z.enum([
    'generate',
    'rewrite',
    'expand',
    'shorten',
    'improve_writing',
    'summarize',
    'create_section',
    'bullet_points',
  ]),
  context: z.string().max(8000).optional(),
  projectId: z.string().optional(),
});

/* ─── System prompts per action ──────────────────────────────────────────── */

const SYSTEM_PROMPTS: Record<string, string> = {
  generate: `You are an expert content creator for presentation slides and documents. 
Generate clear, compelling content based on the prompt. 
Use markdown-like formatting:
- Lines starting with "# " are headings
- Lines starting with "## " are subheadings
- Lines starting with "• " or "- " are bullet points
- Other lines are body text
Keep content concise and impactful. Avoid filler words.`,

  rewrite: `You are an expert editor. Rewrite the given text to be clearer, more impactful, and better structured. 
Preserve the core meaning but improve flow, word choice, and clarity.
Return only the rewritten text, no preamble.`,

  expand: `You are an expert writer. Expand the given text with more detail, examples, and context.
Keep the same tone and style. Add substance without adding fluff.
Return only the expanded text, no preamble.`,

  shorten: `You are an expert editor. Shorten the given text while preserving all key information.
Remove redundancy, tighten sentences, and eliminate filler words.
Return only the shortened text, no preamble.`,

  improve_writing: `You are an expert editor. Improve the writing quality of the given text.
Fix grammar, enhance clarity, improve word choice, and optimize sentence structure.
Return only the improved text, no preamble.`,

  summarize: `You are an expert at summarization. Create a concise, accurate summary of the given content.
Capture the key points in a few sentences. Use plain prose.
Return only the summary, no preamble.`,

  create_section: `You are an expert presentation designer. Create a complete content section based on the prompt.
Structure it with a heading, 2-3 key points, and a closing statement.
Use markdown-like formatting (# for headings, ## for subheadings, • for bullets).`,

  bullet_points: `You are an expert at creating clear, scannable bullet point lists.
Convert or generate content as a bullet point list using "• " prefix for each point.
Each bullet should be concise and standalone. Return only the bullets, no preamble.`,
};

/* ─── POST /ai/generate ──────────────────────────────────────────────────── */

aiRouter.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const { prompt, action, context, projectId } = parsed.data;

    const systemPrompt = SYSTEM_PROMPTS[action] ?? SYSTEM_PROMPTS['generate']!;

    const userMessage = context
      ? `Context:\n${context}\n\n---\n\nRequest: ${prompt}`
      : prompt;

    logger.info('AI', `${action} request from user ${userId}`);

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

    // Persist AI history
    try {
      await prisma.aIHistory.create({
        data: {
          userId,
          projectId: projectId ?? undefined,
          prompt,
          response: responseText,
          model: MODEL,
          tokensUsed,
        },
      });
    } catch (err) {
      // Non-fatal — log but don't fail the request
      logger.error('AI', 'Failed to save AI history', err);
    }

    sendSuccess(res, {
      result: responseText,
      action,
      tokensUsed,
    });
  }),
);

/* ─── POST /ai/generate/stream ───────────────────────────────────────────── */

aiRouter.post(
  '/generate/stream',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid input');
    }

    const { prompt, action, context, projectId } = parsed.data;
    const systemPrompt = SYSTEM_PROMPTS[action] ?? SYSTEM_PROMPTS['generate']!;
    const userMessage = context
      ? `Context:\n${context}\n\n---\n\nRequest: ${prompt}`
      : prompt;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullResponse = '';
    let totalTokens = 0;

    try {
      const stream = await client.messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          const text = chunk.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
        }

        if (chunk.type === 'message_delta' && chunk.usage) {
          totalTokens = chunk.usage.output_tokens;
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done', tokensUsed: totalTokens })}\n\n`);
      res.end();

      // Persist history non-blocking
      prisma.aIHistory.create({
        data: {
          userId,
          projectId: projectId ?? undefined,
          prompt,
          response: fullResponse,
          model: MODEL,
          tokensUsed: totalTokens,
        },
      }).catch((err: unknown) => logger.error('AI', 'Failed to save AI history', err));

    } catch (err) {
      logger.error('AI', 'Stream error', err);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Generation failed' })}\n\n`);
      res.end();
    }
  }),
);

/* ─── GET /ai/history ────────────────────────────────────────────────────── */

aiRouter.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query['limit'] ?? 20), 50);

    const history = await prisma.aIHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        prompt: true,
        action: true,
        model: true,
        tokensUsed: true,
        createdAt: true,
        projectId: true,
      } as never,
    });

    sendSuccess(res, { history });
  }),
);
