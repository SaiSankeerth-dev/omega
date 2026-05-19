'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

/* ─── Context ───────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

/* ─── Config ────────────────────────────────────────────────────────────── */

const STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#34d399', icon: '✓' },
  error: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', color: '#f87171', icon: '✕' },
  info: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', color: '#a78bfa', icon: 'ℹ' },
  warning: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24', icon: '⚠' },
}

/* ─── Provider ──────────────────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const style = STYLES[t.type]
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-2xl pointer-events-auto animate-slide-in-right"
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                color: style.color,
                minWidth: '280px',
                maxWidth: '400px',
              }}
            >
              <span className="font-bold shrink-0">{style.icon}</span>
              <span className="text-white text-xs leading-relaxed">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-auto shrink-0 text-gray-500 hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
