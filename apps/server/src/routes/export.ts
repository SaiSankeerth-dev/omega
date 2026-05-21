import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { sendSuccess, sendError } from '@omega/shared/response';
import { NotFoundError } from '@omega/shared/errors';

export const exportRouter = Router();

const exportSchema = z.object({
  body: z.object({
    format: z.enum(['pptx', 'pdf', 'html', 'json']),
    options: z.object({
      includeImages: z.boolean().optional().default(true),
      includeNotes: z.boolean().optional().default(false),
      template: z.string().optional(),
    }).optional().default({}),
  }),
});

// ── Export a project ───────────────────────────────────────────────────
exportRouter.post(
  '/:projectId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = exportSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        error: parsed.error.errors[0]?.message ?? 'Invalid input',
      });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId } as any,
      include: {
        documents: true,
        slides: { orderBy: { order: 'asc' } },
      },
    });

    if (!project || project.userId !== req.user!.userId) {
      throw new NotFoundError('Project');
    }

    const { format, options } = parsed.data.body;

    switch (format) {
      case 'json': {
        const exportData = {
          name: project.name,
          type: project.type,
          description: project.description,
          slides: project.slides.map(s => ({
            title: s.title,
            order: s.order,
            transition: s.transition,
            content: s.content,
          })),
          document: project.documents[0]?.content ?? null,
          exportedAt: new Date().toISOString(),
          exportedBy: req.user!.email,
        };
        sendSuccess(res, { data: exportData, format: 'json' });
        break;
      }

      case 'pptx': {
        // Generate PPTX-compatible JSON structure for client-side rendering
        // pptxgenjs runs on the client side for binary generation
        const pptxData = {
          title: project.name,
          slides: project.slides.map(s => ({
            title: s.title,
            transition: s.transition,
            elements: extractSlideElements(s.content as any),
          })),
          options: {
            includeImages: options.includeImages,
            includeNotes: options.includeNotes,
          },
        };
        sendSuccess(res, { data: pptxData, format: 'pptx' });
        break;
      }

      case 'html': {
        const doc = project.documents[0];
        const content = doc?.content as any;
        const blocks = content?.blocks ?? [];
        const html = generateHTML(project.name, blocks, options);
        sendSuccess(res, { data: html, format: 'html' });
        break;
      }

      case 'pdf': {
        // Return structured data for client-side PDF generation with html2canvas + jsPDF
        const doc = project.documents[0];
        const pdfData = {
          title: project.name,
          blocks: (doc?.content as any)?.blocks ?? [],
          slides: project.slides,
        };
        sendSuccess(res, { data: pdfData, format: 'pdf' });
        break;
      }

      default:
        sendError(res, 'Invalid export format');
    }
  }),
);

function extractSlideElements(content: any): any[] {
  if (!content || !content.blocks) return [];
  return content.blocks.map((block: any) => ({
    type: block.type,
    content: block.content,
    style: block.style ?? {},
  }));
}

function generateHTML(title: string, blocks: any[], options: any): string {
  const renderBlock = (block: any): string => {
    switch (block.type) {
      case 'heading':
        return `<h2 style="font-size:2rem;font-weight:700;color:#f8fafc;margin:1.5rem 0;">${block.content || ''}</h2>`;
      case 'text':
        return `<p style="font-size:1rem;color:#cbd5e1;line-height:1.7;margin:1rem 0;">${block.content || ''}</p>`;
      case 'image':
        return block.content
          ? `<img src="${block.content}" alt="" style="max-width:100%;border-radius:8px;margin:1rem 0;" />`
          : '';
      case 'quote':
        return `<blockquote style="border-left:3px solid #8b5cf6;padding:0.75rem 1.25rem;margin:1rem 0;color:#a78bfa;font-style:italic;">${block.content || ''}</blockquote>`;
      case 'divider':
        return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1.5rem 0;" />`;
      default:
        return '';
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#050816; color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:2rem; }
  .container { max-width:800px; margin:0 auto; }
</style></head>
<body><div class="container">
<h1 style="font-size:1.25rem;font-weight:600;margin-bottom:2rem;color:#8b5cf6;">${title}</h1>
${blocks.map(renderBlock).join('\n')}
</div></body></html>`;
}
