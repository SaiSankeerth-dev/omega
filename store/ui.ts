'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type SidebarState = 'open' | 'closed';

interface UIState {
  theme: Theme;
  sidebar: SidebarState;
  isMobileMenuOpen: boolean;
  activeModal: string | null;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  setMobileMenuOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  reset: () => void;
}

const initialState = {
  theme: 'system' as Theme,
  sidebar: 'open' as SidebarState,
  isMobileMenuOpen: false,
  activeModal: null,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () =>
    set((state) => ({
      sidebar: state.sidebar === 'open' ? 'closed' : 'open',
    })),

  setSidebar: (sidebar) => set({ sidebar }),

  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),

  openModal: (activeModal) => set({ activeModal }),

  closeModal: () => set({ activeModal: null }),

  reset: () => set(initialState),
}));
