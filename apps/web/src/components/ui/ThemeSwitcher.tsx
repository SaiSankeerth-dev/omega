'use client'

import { useState, useEffect } from 'react'

/* ─── Simple Toggle Button ───────────────────────────────────────────────── */

type Theme = 'dark' | 'light'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('omega_theme') as Theme | null
    if (stored) setTheme(stored)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('omega_theme', next)
    const root = document.documentElement
    if (next === 'light') {
      root.style.setProperty('--background', '#f8fafc')
      root.style.setProperty('--foreground', '#020212')
      root.classList.remove('dark')
    } else {
      root.style.setProperty('--background', '#020212')
      root.style.setProperty('--foreground', '#f8fafc')
      root.classList.add('dark')
    }
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
