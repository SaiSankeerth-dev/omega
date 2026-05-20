'use client'

import { create } from 'zustand'
import { api } from '@/lib/api'

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt?: string
  updatedAt?: string
}

interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: string
}

interface MeResponse {
  user: User
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loadMe: () => Promise<void>
  refresh: () => Promise<string | null>
  logout: () => Promise<void>
  reset: () => void
}

const TOKEN_KEY = 'omega_access_token'
const REFRESH_KEY = 'omega_refresh_token'
const LEGACY_TOKEN_KEY = 'omega_token'

const readToken = (key: string): string | null =>
  typeof window === 'undefined' ? null : localStorage.getItem(key)

const writeToken = (key: string, value: string | null) => {
  if (typeof window === 'undefined') return
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

const clearStoredTokens = () => {
  writeToken(TOKEN_KEY, null)
  writeToken(REFRESH_KEY, null)
  writeToken(LEGACY_TOKEN_KEY, null)
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
}

const applyAuth = (auth: AuthResponse) => {
  writeToken(TOKEN_KEY, auth.accessToken)
  writeToken(REFRESH_KEY, auth.refreshToken)
  writeToken(LEGACY_TOKEN_KEY, null)
  return {
    user: auth.user,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
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

  setTokens: (accessToken, refreshToken) => {
    writeToken(TOKEN_KEY, accessToken)
    writeToken(REFRESH_KEY, refreshToken)
    set({ accessToken, refreshToken })
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const auth = await api.post<AuthResponse>('/auth/login', { email, password })
      set(applyAuth(auth))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      set({ error: message, isLoading: false, isAuthenticated: false, user: null })
      throw error
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null })
    try {
      const auth = await api.post<AuthResponse>('/auth/register', { name, email, password })
      set(applyAuth(auth))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      set({ error: message, isLoading: false, isAuthenticated: false, user: null })
      throw error
    }
  },

  loadMe: async () => {
    const token = get().accessToken ?? readToken(TOKEN_KEY) ?? readToken(LEGACY_TOKEN_KEY)
    const refreshToken = get().refreshToken ?? readToken(REFRESH_KEY)

    if (!token && !refreshToken) {
      set({ ...initialState, isLoading: false })
      return
    }

    set({ isLoading: true, accessToken: token, refreshToken })

    try {
      if (!token) {
        await get().refresh()
      }

      const currentToken = get().accessToken
      if (!currentToken) {
        throw new Error('Session expired')
      }

      const data = await api.get<MeResponse>('/auth/me', currentToken)
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null })
    } catch {
      const refreshed = await get().refresh()
      if (!refreshed) {
        clearStoredTokens()
        set({ ...initialState, isLoading: false })
        return
      }

      const data = await api.get<MeResponse>('/auth/me', refreshed)
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null })
    }
  },

  refresh: async () => {
    const refreshToken = get().refreshToken ?? readToken(REFRESH_KEY)
    if (!refreshToken) return null

    try {
      const auth = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
      set(applyAuth(auth))
      return auth.accessToken
    } catch {
      clearStoredTokens()
      set({ ...initialState, isLoading: false })
      return null
    }
  },

  logout: async () => {
    const token = get().accessToken ?? readToken(TOKEN_KEY) ?? readToken(LEGACY_TOKEN_KEY)

    try {
      if (token) {
        await api.post('/auth/logout', undefined, token)
      }
    } finally {
      clearStoredTokens()
      set({ ...initialState, isLoading: false })
    }
  },

  reset: () => {
    clearStoredTokens()
    set({ ...initialState, isLoading: false })
  },
}))
