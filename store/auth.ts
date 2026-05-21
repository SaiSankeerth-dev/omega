'use client';

import { create } from 'zustand';
import type { User } from '@omega/shared';

const TOKEN_KEY = 'omega-auth-token';
const REFRESH_KEY = 'omega-refresh-token';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data?: T; error?: { code: string; message: string } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
    return (await response.json()) as { data?: T; error?: { code: string; message: string } };
  } catch {
    return { error: { code: 'NETWORK_ERROR', message: 'Network error. Please check your connection.' } };
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

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const result = await apiRequest<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.error) {
      set({ error: result.error.message, isLoading: false });
      return;
    }

    if (result.data) {
      try {
        localStorage.setItem(TOKEN_KEY, result.data.accessToken);
        localStorage.setItem(REFRESH_KEY, result.data.refreshToken);
      } catch { /* localStorage unavailable */ }

      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });

    const result = await apiRequest<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (result.error) {
      set({ error: result.error.message, isLoading: false });
      return;
    }

    if (result.data) {
      try {
        localStorage.setItem(TOKEN_KEY, result.data.accessToken);
        localStorage.setItem(REFRESH_KEY, result.data.refreshToken);
      } catch { /* localStorage unavailable */ }

      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch { /* ignore */ }

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch { /* localStorage unavailable */ }

    set({ ...initialState, isLoading: false });
  },

  loadMe: async () => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

    if (!token) {
      set({ ...initialState, isLoading: false });
      return;
    }

    set({ isLoading: true });

    const result = await apiRequest<{ user: User }>('/auth/me');

    if (result.error) {
      try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
      try { localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ }
      set({ ...initialState, isLoading: false });
      return;
    }

    if (result.data) {
      set({
        user: result.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    }
  },

  reset: () => set(initialState),
}));
