'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const VALID_THEMES: readonly Theme[] = ['light', 'dark', 'system'];
const THEME_STORAGE_KEY = 'omega-theme';
const THEME_CHANGE_EVENT = 'omega-theme-change';

// --- External store subscriptions ---

function subscribeToColorScheme(onChange: () => void): () => void {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getColorSchemeSnapshot(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getColorSchemeServerSnapshot(): 'dark' | 'light' {
  return 'light';
}

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (saved && VALID_THEMES.includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }
  return 'system';
}

function getServerTheme(): Theme {
  return 'system';
}

function subscribeToThemeEvent(onChange: () => void): () => void {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getEventThemeSnapshot(): Theme | null {
  const theme = document.documentElement.dataset.omegaTheme as Theme | undefined;
  return theme && VALID_THEMES.includes(theme) ? theme : null;
}

function getEventThemeServerSnapshot(): null {
  return null;
}

function resolveTheme(
  theme: Theme,
  systemPreference: 'light' | 'dark',
): 'light' | 'dark' {
  if (theme === 'system') return systemPreference;
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Subscribe to external sources
  const systemPreference = useSyncExternalStore(
    subscribeToColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot,
  );

  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getSavedTheme,
    getServerTheme,
  );

  const eventTheme = useSyncExternalStore(
    subscribeToThemeEvent,
    getEventThemeSnapshot,
    getEventThemeServerSnapshot,
  );

  // Derive the effective theme: eventTheme (same-tab) > storedTheme (cross-tab) > 'system'
  const theme: Theme = useMemo(() => eventTheme ?? storedTheme, [eventTheme, storedTheme]);
  const resolvedTheme = useMemo<'light' | 'dark'>(
    () => resolveTheme(theme, systemPreference),
    [theme, systemPreference],
  );

  // Sync the DOM with the resolved theme (side effect, not state)
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // localStorage not available
    }
    document.documentElement.dataset.omegaTheme = newTheme;
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
  };

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
