'use client'

import { create } from 'zustand'

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  reset: () => void
}

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  logout: () => set(initialState),

  reset: () => set(initialState),
}))
