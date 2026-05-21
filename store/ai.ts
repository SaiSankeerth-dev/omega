// store/ai.ts — replaces existing store/ai.ts
// Now wired to real backend SSE stream + presentation generation API.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  error?: boolean;
}

export interface GeneratedPresentation {
  title: string;
  description: string;
  theme: {
    name: string;
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
  };
  slides: GeneratedSlide[];
}

export interface GeneratedSlide {
  id: string;
  type: 'title' | 'agenda' | 'content' | 'two-column' | 'quote' | 'stats' | 'image-text' | 'cta' | 'divider';
  title: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  stats?: { value: string; label: string; trend?: 'up' | 'down' | 'neutral' }[];
  quote?: { text: string; author: string; role: string };
  leftContent?: { title: string; body: string };
  rightContent?: { title: string; body: string };
  imagePrompt?: string;
  ctaText?: string;
  ctaUrl?: string;
  notes?: string;
}

interface AIState {
  // Chat
  messages: AIMessage[];
  isStreaming: boolean;
  streamingContent: string;
  sessionId: string | null;

  // Presentation generation
  isGenerating: boolean;
  generatedPresentation: GeneratedPresentation | null;
  generationError: string | null;

  // Token usage
  totalTokensUsed: number;
  requestCount: number;

  // History
  history: Array<{ id: string; type: string; prompt: string; response: string; createdAt: string }>;
  fetchHistory: () => Promise<void>;

  // Actions
  sendMessage: (content: string, slideContext?: string) => Promise<void>;
  generatePresentation: (opts: {
    prompt: string;
    slideCount?: number;
    tone?: string;
    audience?: string;
  }) => Promise<GeneratedPresentation | null>;
  clearChat: () => void;
  clearPresentation: () => void;
  newSession: () => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      messages: [],
      isStreaming: false,
      streamingContent: '',
      sessionId: null,
      isGenerating: false,
      generatedPresentation: null,
      generationError: null,
      totalTokensUsed: 0,
      requestCount: 0,
      history: [],

      sendMessage: async (content: string, slideContext?: string) => {
        const userMessage: AIMessage = { id: uid(), role: 'user', content, createdAt: Date.now() };
        const assistantId = uid();

        set(s => ({
          messages: [...s.messages, userMessage],
          isStreaming: true,
          streamingContent: '',
        }));

        // Get auth token from auth store / localStorage
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('omega_access_token') ?? '')
          : '';

        try {
          const response = await fetch(`${API}/api/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages: get().messages.map(m => ({ role: m.role, content: m.content })),
              slideContext,
            }),
          });

          if (!response.ok || !response.body) {
            throw new Error(`Request failed: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
              try {
                const chunk = JSON.parse(line.slice(6));
                if (chunk.error) throw new Error(chunk.error);
                accumulated += chunk.delta ?? '';
                set({ streamingContent: accumulated });
                if (chunk.done) break;
              } catch (e) {
                if (e instanceof SyntaxError) continue; // incomplete chunk
                throw e;
              }
            }
          }

          const assistantMessage: AIMessage = {
            id: assistantId,
            role: 'assistant',
            content: accumulated,
            createdAt: Date.now(),
          };

          set(s => ({
            messages: [...s.messages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
            requestCount: s.requestCount + 1,
          }));
        } catch (err) {
          const errMessage: AIMessage = {
            id: assistantId,
            role: 'assistant',
            content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
            createdAt: Date.now(),
            error: true,
          };
          set(s => ({
            messages: [...s.messages, errMessage],
            isStreaming: false,
            streamingContent: '',
          }));
        }
      },

      generatePresentation: async ({ prompt, slideCount = 7, tone = 'professional', audience }) => {
        set({ isGenerating: true, generationError: null });
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('omega_access_token') ?? '')
          : '';

        try {
          const res = await fetch(`${API}/api/ai/presentations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ prompt, slideCount, tone, audience }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error ?? 'Generation failed');
          const presentation = json.data.presentation as GeneratedPresentation;
          set({ isGenerating: false, generatedPresentation: presentation, requestCount: get().requestCount + 1 });
          return presentation;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Generation failed';
          set({ isGenerating: false, generationError: msg });
          return null;
        }
      },

      fetchHistory: async () => {
        const token = typeof window !== 'undefined'
          ? (localStorage.getItem('omega_access_token') ?? '')
          : '';
        try {
          const res = await fetch(`${API}/api/ai/history`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.items)) {
            set({ history: json.data.items });
          }
        } catch {
          // silently fail - history is non-critical
        }
      },

      clearChat: () => set({ messages: [], streamingContent: '', isStreaming: false }),
      clearPresentation: () => set({ generatedPresentation: null, generationError: null }),
      newSession: () => set({ messages: [], sessionId: uid(), streamingContent: '', isStreaming: false }),
    }),
    {
      name: 'omega-ai-store',
      partialize: s => ({
        messages: s.messages.slice(-50), // persist last 50 messages only
        sessionId: s.sessionId,
        totalTokensUsed: s.totalTokensUsed,
        requestCount: s.requestCount,
      }),
    },
  ),
);
