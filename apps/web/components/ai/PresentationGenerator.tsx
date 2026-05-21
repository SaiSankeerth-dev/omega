'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAIStore, type GeneratedPresentation } from '@/store/ai';
import { useProjectsStore } from '@/store/projects';

interface Props {
  onGenerated?: (presentation: GeneratedPresentation) => void;
}

const TONES = ['professional', 'creative', 'educational', 'minimal', 'bold', 'playful'] as const;
const SLIDE_COUNTS = [5, 6, 7, 8, 10, 12] as const;

export function PresentationGenerator({ onGenerated }: Props) {
  const router = useRouter();
  const { generatePresentation, isGenerating, generationError } = useAIStore();
  const { createProject } = useProjectsStore();

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<typeof TONES[number]>('professional');
  const [slideCount, setSlideCount] = useState(7);
  const [audience, setAudience] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    const presentation = await generatePresentation({ prompt, slideCount, tone, audience: audience || undefined });
    if (!presentation) return;

    // Auto-create a project and redirect to editor
    const project = await createProject({
      name: presentation.title,
      description: `Generated presentation: ${prompt}`,
    });

    if (project?.id) {
      router.push(`/editor/${project.id}?fromAI=true`);
    }
    onGenerated?.(presentation);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 opacity-70">What's your presentation about?</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 'The future of renewable energy for investors' or 'Q4 product roadmap for our engineering team'"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate(); }}
        />
      </div>

      {/* Options row */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {/* Tone */}
        <div className="flex-1 min-w-32">
          <label className="block text-xs opacity-50 mb-1.5">Tone</label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all"
                style={{
                  background: tone === t ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${tone === t ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Slide count */}
        <div className="min-w-32">
          <label className="block text-xs opacity-50 mb-1.5">Slides</label>
          <div className="flex gap-1.5">
            {SLIDE_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setSlideCount(n)}
                className="px-2.5 py-1 rounded-lg text-xs transition-all"
                style={{
                  background: slideCount === n ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${slideCount === n ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audience (optional) */}
      <div className="mb-6">
        <label className="block text-xs opacity-50 mb-1.5">Target audience (optional)</label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. investors, engineers, executives, students"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Error */}
      {generationError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>
          {generationError}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className="w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">◌</span>
            Generating {slideCount} slides…
          </span>
        ) : (
          `✦ Generate ${slideCount}-slide presentation`
        )}
      </button>

      {isGenerating && (
        <p className="text-center text-xs opacity-40 mt-3">
          This takes 10–30 seconds depending on model load. All free, no cost.
        </p>
      )}
    </div>
  );
}
