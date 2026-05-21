'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from '@/lib/api'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
}

/* ─── Notification Bell ──────────────────────────────────────────────────── */

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      if (!token) return

      const [data, countData] = await Promise.all([
        api.get<{ data: Notification[]; total: number }>('/notifications?limit=10', token),
        api.get<{ count: number }>('/notifications/unread/count', token),
      ])

      setNotifications(data.data || [])
      setUnreadCount(countData.count || 0)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('omega_access_token')
      await api.put(`/notifications/${id}/read`, {}, token ?? undefined)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Silent fail
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('omega_access_token')
      await api.put('/notifications/read-all', {}, token ?? undefined)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Silent fail
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl overflow-hidden z-50"
          style={{
            backgroundColor: '#0d0d1a',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">No notifications</p>
                <p className="text-xs text-gray-600 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 transition-all hover:bg-white/5 ${
                    !n.read ? 'bg-violet-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-sm shrink-0 mt-0.5">
                      {TYPE_ICONS[n.type] || 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${n.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[9px] text-gray-600 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
