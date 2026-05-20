'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'
import { useAuthStore } from './auth'

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface Project {
  id: string
  name: string
  description?: string | null
  workspaceId?: string | null
  createdAt: string
  updatedAt: string
  _count?: { documents: number }
}

export interface EditorDocument {
  id: string
  projectId: string
  content: Record<string, unknown>
  version: number
  createdAt: string
  updatedAt: string
}

interface ProjectsResponse { projects: Project[] }
interface ProjectResponse { project: Project }
interface DocumentResponse { document: EditorDocument | null }

/* ─── Store interface ────────────────────────────────────────────────────── */

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  currentDocument: EditorDocument | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  createProject: (data: { name: string; description?: string }) => Promise<Project>
  updateProject: (id: string, data: { name?: string; description?: string }) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  loadDocument: (projectId: string) => Promise<void>
  saveDocument: (projectId: string, content: Record<string, unknown>) => Promise<void>
  setCurrentProject: (project: Project | null) => void
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

/* ─── Store ──────────────────────────────────────────────────────────────── */

const initialState = {
  projects: [],
  currentProject: null,
  currentDocument: null,
  isLoading: false,
  isSaving: false,
  error: null,
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  ...initialState,

  fetchProjects: async () => {
    const token = getToken()
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const data = await api.get<ProjectsResponse>('/projects', token)
      set({ projects: data.projects, isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load projects'
      set({ error: msg, isLoading: false })
    }
  },

  fetchProject: async (id: string) => {
    const token = getToken()
    if (!token) return

    set({ isLoading: true, error: null })
    try {
      const data = await api.get<ProjectResponse>(`/projects/${id}`, token)
      set({ currentProject: data.project, isLoading: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load project'
      set({ error: msg, isLoading: false })
    }
  },

  createProject: async ({ name, description }) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    set({ isLoading: true, error: null })
    try {
      const data = await api.post<ProjectResponse>('/projects', { name, description }, token)
      const project = data.project

      set((state) => ({
        projects: [project, ...state.projects],
        currentProject: project,
        isLoading: false,
      }))

      return project
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create project'
      set({ error: msg, isLoading: false })
      throw err
    }
  },

  updateProject: async (id: string, data) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    try {
      const res = await api.patch<ProjectResponse>(`/projects/${id}`, data, token)
      const updated = res.project

      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update project'
      set({ error: msg })
      throw err
    }
  },

  deleteProject: async (id: string) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    try {
      await api.delete(`/projects/${id}`, token)
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete project'
      set({ error: msg })
      throw err
    }
  },

  loadDocument: async (projectId: string) => {
    const token = getToken()
    if (!token) return

    try {
      const data = await api.get<DocumentResponse>(`/projects/${projectId}/document`, token)
      set({ currentDocument: data.document })
    } catch {
      // Non-fatal — new projects may not have a document yet
      set({ currentDocument: null })
    }
  },

  saveDocument: async (projectId: string, content: Record<string, unknown>) => {
    const token = getToken()
    if (!token) throw new Error('Not authenticated')

    set({ isSaving: true })
    try {
      const data = await api.put<DocumentResponse>(
        `/projects/${projectId}/document`,
        { content },
        token,
      )
      set({ currentDocument: data.document, isSaving: false })
    } catch (err) {
      set({ isSaving: false })
      throw err
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}))

/* ─── Selectors ──────────────────────────────────────────────────────────── */

export const selectRecentProjects = (n = 6) =>
  useProjectsStore((s) =>
    [...s.projects].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    ).slice(0, n),
  )
