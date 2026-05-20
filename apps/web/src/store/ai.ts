'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import { useAuthStore } from './auth'

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type AIAction =
  | 'generate'
  | 'rewrite'
  | 'expand'
  | 'shorten'
  | 'improve_writing'
  | 'summarize'
  | 'create_section'
  | 'bullet_points'

export interface GenerateOptions {
  prompt: string
  action: AIAction
  context?: string
  projectId?: string
}

export interface StreamCallbacks {
  onDelta?: (text: string) => void
  onDone?: (fullText: string, tokensUsed: number) => void
  onError?: (message: string) => void
}

interface AIHistoryItem {
  id: string
  prompt: string
  model: string
  tokensUsed: number
  createdAt: string
  projectId?: string
}

interface GenerateResponse {
  result: string
  action: string
  tokensUsed: number
}

interface HistoryResponse {
  history: AIHistoryItem[]
}

/* ─── Store interface ────────────────────────────────────────────────────── */

interface AIState {
  isProcessing: boolean
  isStreaming: boolean
  lastResult: string | null
  lastTokensUsed: number
  history: AIHistoryItem[]
  error: string | null
  totalTokensUsed: number

  // Actions
  generate: (opts: GenerateOptions) => Promise<string>
  generateStream: (opts: GenerateOptions, callbacks: StreamCallbacks) => Promise<void>
  fetchHistory: () => Promise<void>
  clearError: () => void
  reset: () => void
}

/* ─── Token helper ───────────────────────────────────────────────────────── */

const getToken = (): string | null => {
  const fromStore = useAuthStore.getState().accessToken
  if (fromStore) return fromStore
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('omega_access_token') ??
    localStorage.getItem('omega_token')
  )
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

/* ─── Store ──────────────────────────────────────────────────────────────── */

export const useAIStore = create<AIState>((set, get) => ({
  isProcessing: false,
  isStreaming: false,
  lastResult: null,
  lastTokensUsed: 0,
  history: [],
  error: null,
  totalTokensUsed: 0,

  generate: async ({ prompt, action, context, projectId }: GenerateOptions): Promise<string> => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    set({ isProcessing: true, error: null })

    try {
      const data = await api.post<GenerateResponse>(
        '/ai/generate',
        { prompt, action, context, projectId },
        token,
      )

      set((state) => ({
        isProcessing: false,
        lastResult: data.result,
        lastTokensUsed: data.tokensUsed,
        totalTokensUsed: state.totalTokensUsed + data.tokensUsed,
        error: null,
      }))

      return data.result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI generation failed'
      set({ isProcessing: false, error: msg })
      throw err
    }
  },

  generateStream: async (
    { prompt, action, context, projectId }: GenerateOptions,
    { onDelta, onDone, onError }: StreamCallbacks,
  ): Promise<void> => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    set({ isStreaming: true, error: null })

    let fullText = ''

    try {
      const response = await fetch(`${BASE_URL}/ai/generate/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt, action, context, projectId }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6)) as {
              type: string
              text?: string
              tokensUsed?: number
              message?: string
            }

            if (json.type === 'delta' && json.text) {
              fullText += json.text
              onDelta?.(json.text)
            } else if (json.type === 'done') {
              const tokensUsed = json.tokensUsed ?? 0
              set((state) => ({
                isStreaming: false,
                lastResult: fullText,
                lastTokensUsed: tokensUsed,
                totalTokensUsed: state.totalTokensUsed + tokensUsed,
              }))
              onDone?.(fullText, tokensUsed)
            } else if (json.type === 'error') {
              throw new Error(json.message ?? 'Stream error')
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Streaming failed'
      set({ isStreaming: false, error: msg })
      onError?.(msg)
    }
  },

  fetchHistory: async (): Promise<void> => {
    const token = getToken()
    if (!token) return

    try {
      const data = await api.get<HistoryResponse>('/ai/history', token)
      set({ history: data.history })
    } catch {
      // Non-fatal
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      isProcessing: false,
      isStreaming: false,
      lastResult: null,
      lastTokensUsed: 0,
      history: [],
      error: null,
    }),
}))

/* ─── Convenience hook ───────────────────────────────────────────────────── */

export const useAI = () => {
  const { generate, generateStream, isProcessing, isStreaming, error, lastResult, totalTokensUsed } =
    useAIStore()
  return { generate, generateStream, isProcessing, isStreaming, error, lastResult, totalTokensUsed }
}
