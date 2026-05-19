'use client';

import { create } from 'zustand';

interface EditorState {
  currentProjectId: string | null;
  content: Record<string, unknown> | null;
  isDirty: boolean;
  lastSaved: Date | null;

  // Actions
  setCurrentProject: (projectId: string) => void;
  setContent: (content: Record<string, unknown>) => void;
  markSaved: () => void;
  reset: () => void;
}

const initialState = {
  currentProjectId: null,
  content: null,
  isDirty: false,
  lastSaved: null,
};

export const useEditorStore = create<EditorState>((set) => ({
  ...initialState,

  setCurrentProject: (currentProjectId) =>
    set({ currentProjectId }),

  setContent: (content) =>
    set({ content, isDirty: true }),

  markSaved: () =>
    set({ isDirty: false, lastSaved: new Date() }),

  reset: () => set(initialState),
}));
