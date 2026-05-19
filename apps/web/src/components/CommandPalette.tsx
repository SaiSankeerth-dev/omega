'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/* ─── Context ───────────────────────────────────────────────────────────── */

interface CommandPaletteContextValue {
  open: () => void
  close: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}

/* ─── Data ──────────────────────────────────────────────────────────────── */

interface CommandItem {
  id: string
  label: string
  icon: string
  shortcut?: string
  section: string
  action: () => void
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(0)
  }, [])

  /* ── Keyboard shortcut (Cmd+K / Ctrl+K) ──────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close])

  /* ── Focus input when opened ─────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const allItems: CommandItem[] = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: '🏠', shortcut: 'G D', section: 'Pages', action: () => router.push('/dashboard') },
    { id: 'templates', label: 'Open Templates', icon: '📋', shortcut: 'G T', section: 'Pages', action: () => router.push('/templates') },
    { id: 'new-pres', label: 'New Presentation', icon: '📊', section: 'Actions', action: () => router.push('/editor/new?type=presentation') },
    { id: 'new-website', label: 'New Website', icon: '🌐', section: 'Actions', action: () => router.push('/editor/new?type=website') },
    { id: 'new-doc', label: 'New Document', icon: '📝', section: 'Actions', action: () => router.push('/editor/new?type=document') },
    { id: 'logout', label: 'Sign Out', icon: '🚪', shortcut: '⌘Q', section: 'Actions', action: () => { localStorage.removeItem('omega_token'); router.push('/auth') } },
  ]

  const filtered = query
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems

  const sections = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const group = acc[item.section] ?? []
    group.push(item)
    acc[item.section] = group
    return acc
  }, {})

  const flatItems = filtered

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const max = flatItems.length - 1
      setActiveIndex((prev) => (prev < max ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = activeIndex >= 0 && activeIndex < flatItems.length ? flatItems[activeIndex] : undefined
      if (item) {
        item.action()
        close()
      }
    }
  }

  if (!isOpen) return <CommandPaletteContext.Provider value={{ open, close }}>{children}</CommandPaletteContext.Provider>

  return (
    <CommandPaletteContext.Provider value={{ open, close }}>
      {children}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={close}
      >
        {/* Modal */}
        <div
          className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up"
          style={{
            backgroundColor: '#0d0d1a',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
              onKeyDown={handleKeyNav}
              placeholder="Search pages, actions, templates..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {Object.entries(sections).map(([sectionName, items]) => (
              <div key={sectionName} className="mb-2">
                <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 py-1.5">
                  {sectionName}
                </h3>
                {items.map((item) => {
                  const idx = flatItems.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); close() }}
                      className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm transition-all"
                      style={{
                        backgroundColor: idx === activeIndex ? 'rgba(139,92,246,0.15)' : 'transparent',
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1 text-left text-gray-300">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border"
                          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-8">No results found.</p>
            )}
          </div>
        </div>
      </div>
    </CommandPaletteContext.Provider>
  )
}
