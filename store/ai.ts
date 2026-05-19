'use client';

import { create } from 'zustand';

interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIState {
  isProcessing: boolean;
  currentSessionId: string | null;
  messages: AIChatMessage[];
  error: string | null;

  // Actions
  setProcessing: (processing: boolean) => void;
  setCurrentSession: (sessionId: string) => void;
  addMessage: (message: AIChatMessage) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isProcessing: false,
  currentSessionId: null,
  messages: [],
  error: null,
};

export const useAIStore = create<AIState>((set) => ({
  ...initialState,

  setProcessing: (isProcessing) => set({ isProcessing }),

  setCurrentSession: (currentSessionId) => set({ currentSessionId }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  clearMessages: () => set({ messages: [] }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
