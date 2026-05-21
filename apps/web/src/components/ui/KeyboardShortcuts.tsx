'use client'

import { useState, useEffect, useCallback } from 'react'

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string; description: string }[]
}

const ALL_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: '⌘K', description: 'Open command palette' },
      { keys: 'Esc', description: 'Close modal / Go back' },
      { keys: '⌘S', description: 'Save current document' },
      { keys: '⌘Z', description: 'Undo' },
      { keys: '⌘⇧Z', description: 'Redo' },
      { keys: '⌘F', description: 'Search in document' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: '⌘B', description: 'Bold text' },
      { keys: '⌘I', description: 'Italic text' },
      { keys: '⌘K', description: 'Insert link' },
      { keys: '⌘/↵', description: 'Insert block below' },
      { keys: '⌘⇧/↵', description: 'Insert block above' },
      { keys: '⌘⌫', description: 'Delete block' },
    ],
  },
  {
    title: 'Presentation',
    shortcuts: [
      { keys: '→ / ↓', description: 'Next slide' },
      { keys: '← / ↑', description: 'Previous slide' },
      { keys: 'Esc', description: 'Exit presentation' },
      { keys: 'F', description: 'Toggle fullscreen' },
      { keys: 'M', description: 'Toggle minimap' },
      { keys: 'Space', description: 'Next slide' },
    ],
  },
  {
    title: 'Dashboard',
    shortcuts: [
      { keys: 'N', description: 'New project' },
      { keys: '/', description: 'Search projects' },
      { keys: '?', description: 'Show this help' },
      { keys: '⌘,', description: 'Open settings' },
    ],
  },
]

export function useKeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Open with ?
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        // Only if not in an input
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return { isOpen, open, close, ShortcutsOverlay }
}

/* ─── Overlay Component ─────────────────────────────────────────────────── */

function ShortcutsOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: '#0d0d1a',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-4 space-y-5">
          {ALL_SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="text-xs text-gray-400">{s.description}</span>
                    <kbd className="text-[10px] text-gray-500 px-2 py-0.5 rounded border font-mono" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] text-gray-600 text-center">
            Press <kbd className="text-gray-500 px-1 py-0.5 rounded border font-mono" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>?</kbd> to toggle this overlay
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Provider ──────────────────────────────────────────────────────────── */

import { createContext, useContext, type ReactNode } from 'react'

interface ShortcutsContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null)

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const { isOpen, open, close } = useKeyboardShortcuts()

  return (
    <ShortcutsContext.Provider value={{ isOpen, open, close }}>
      {children}
      <ShortcutsOverlay isOpen={isOpen} onClose={close} />
    </ShortcutsContext.Provider>
  )
}

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext)
  if (!ctx) throw new Error('useShortcuts must be used within ShortcutsProvider')
  return ctx
}
