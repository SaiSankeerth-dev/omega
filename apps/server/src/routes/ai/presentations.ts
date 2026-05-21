// POST /api/ai/presentations          — generate full presentation JSON
// POST /api/ai/presentations/improve  — improve a single slide
// POST /api/ai/presentations/animate  — get animation config for a slide

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getAIProvider } from '@omega/ai/providers';
import { PROMPTS, } from '@omega/ai/prompts';
import { JSON_MODEL } from '@omega/ai/providers';

export const presentationsRouter = Router();

// ── Helper: strip markdown fences and extract JSON ───────────────────────
function extractJSON(raw: string): unknown {
  const stripped = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();

  // Try direct parse first
  try { return JSON.parse(stripped); } catch { /* fall through */ }

  // Extract largest JSON object from response
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

// ── POST /api/ai/presentations ───────────────────────────────────────────
const GenerateSchema = z.object({
  prompt:     z.string().min(3).max(500),
  slideCount: z.number().int().min(3).max(15).default(7),
  tone:       z.enum(['professional', 'creative', 'educational', 'minimal', 'bold', 'playful']).default('professional'),
  audience:   z.string().max(100).optional(),
  language:   z.string().max(20).default('English'),
});

presentationsRouter.post('/', async (req: Request, res: Response) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.errors[0]?.message });
    return;
  }

  const { prompt, slideCount, tone, audience, language } = parsed.data;

  const userMessage = [
    `Create a ${tone} presentation in ${language} about: "${prompt}"`,
    `Requirements: exactly ${slideCount} slides`,
    audience ? `Target audience: ${audience}` : '',
    'Make it compelling, specific, and visually rich.',
    'imagePrompt fields must be vivid and detailed for AI image generation.',
  ].filter(Boolean).join('\n');

  let presentation: unknown;
  try {
    const provider = getAIProvider();
    const raw = await provider.generate(
      [
        { role: 'system', content: PROMPTS.PRESENTATION },
        { role: 'user',   content: userMessage },
      ],
      { model: JSON_MODEL, temperature: 0.4, maxTokens: 6000 },
    );
    presentation = extractJSON(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    res.status(502).json({ success: false, error: message });
    return;
  }

  res.json({
    success: true,
    data: {
      presentation,
      meta: { prompt, tone, slideCount, language, model: JSON_MODEL, generatedAt: new Date().toISOString() },
    },
  });
});

// ── POST /api/ai/presentations/improve ───────────────────────────────────
presentationsRouter.post('/improve', async (req: Request, res: Response) => {
  const schema = z.object({ slide: z.record(z.unknown()) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: 'Invalid slide data' }); return; }

  try {
    const provider = getAIProvider();
    const raw = await provider.generate([
      { role: 'system', content: PROMPTS.IMPROVE_SLIDE(JSON.stringify(parsed.data.slide, null, 2)) },
      { role: 'user',   content: 'Improve this slide.' },
    ], { model: JSON_MODEL, temperature: 0.3 });

    res.json({ success: true, data: extractJSON(raw) });
  } catch (err) {
    res.status(502).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
});

// ── POST /api/ai/presentations/animate ───────────────────────────────────
presentationsRouter.post('/animate', async (req: Request, res: Response) => {
  const schema = z.object({
    slideTitle: z.string().min(1).max(200),
    slideType:  z.string().min(1).max(50),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ success: false, error: 'Invalid input' }); return; }

  try {
    const provider = getAIProvider();
    const raw = await provider.generate([
      { role: 'system', content: PROMPTS.ANIMATE(parsed.data.slideTitle, parsed.data.slideType) },
      { role: 'user',   content: 'Generate animation config.' },
    ], { model: JSON_MODEL, temperature: 0.2, maxTokens: 512 });

    res.json({ success: true, data: extractJSON(raw) });
  } catch (err) {
    res.status(502).json({ success: false, error: err instanceof Error ? err.message : 'Failed' });
  }
});
