'use client'

import { useState, useEffect, useRef } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Collaborator {
  userId: string
  email: string
  socketId: string
}

interface CursorPosition {
  userId: string
  email: string
  position: { x: number; y: number }
}

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface CollaborationIndicatorsProps {
  projectId: string
}

interface PresenceDotsProps {
  collaborators: Collaborator[]
}

/* ─── Colors for collaborators ─────────────────────────────────────────── */

const COLORS = [
  '#7c3aed', '#4f46e5', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

function getColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i)
  }
  return COLORS[Math.abs(hash) % COLORS.length]!
}

/* ─── Presence Dots ─────────────────────────────────────────────────────── */

export function PresenceDots({ collaborators }: PresenceDotsProps) {
  if (collaborators.length === 0) return null

  return (
    <div className="flex items-center -space-x-1.5">
      {collaborators.map((c, i) => (
        <div
          key={c.socketId}
          className="relative group"
          style={{ zIndex: collaborators.length - i }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white border-2 border-[#050816]"
            style={{ backgroundColor: getColor(c.userId) }}
          >
            {c.email!.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            {c.email}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Cursor Overlay ────────────────────────────────────────────────────── */

export function CursorOverlay({ cursors }: { cursors: CursorPosition[] }) {
  if (cursors.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute transition-all duration-150 ease-linear"
          style={{
            left: cursor.position.x,
            top: cursor.position.y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor arrow */}
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path d="M2 1L14 13H8.5L6.5 18L2 14V1Z" fill={getColor(cursor.userId)} />
          </svg>
          {/* Label */}
          <span
            className="absolute top-0 left-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: getColor(cursor.userId) }}
          >
            {cursor.email}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Collaboration Hook ────────────────────────────────────────────────── */

// NOTE: This hook requires socket.io-client to be installed
// It provides real-time cursor and presence syncing
export function useCollaboration({ projectId }: CollaborationIndicatorsProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [cursors, setCursors] = useState<CursorPosition[]>([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<ReturnType<typeof import('socket.io-client')['io']> | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const { io } = await import('socket.io-client')
        const token = localStorage.getItem('omega_access_token')
        if (!token) return

        const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
          auth: { token },
          transports: ['websocket', 'polling'],
        })

        socketRef.current = socket

        socket.on('connect', () => {
          if (cancelled) return
          setConnected(true)
          socket.emit('join:project', projectId)
        })

        socket.on('room:collaborators', (users: Collaborator[]) => {
          if (!cancelled) setCollaborators(users)
        })

        socket.on('user:joined', (user: Collaborator) => {
          if (!cancelled) setCollaborators((prev) => {
            if (prev.find((c) => c.socketId === user.socketId)) return prev
            return [...prev, user]
          })
        })

        socket.on('user:left', (data: { userId: string; socketId: string }) => {
          if (!cancelled) {
            setCollaborators((prev) => prev.filter((c) => c.socketId !== data.socketId))
            setCursors((prev) => prev.filter((c) => c.userId !== data.userId))
          }
        })

        socket.on('cursor:moved', (data: CursorPosition) => {
          if (!cancelled) {
            setCursors((prev) => {
              const idx = prev.findIndex((c) => c.userId === data.userId)
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = data
                return next
              }
              return [...prev, data]
            })
          }
        })

        socket.on('disconnect', () => {
          if (!cancelled) {
            setConnected(false)
            setCollaborators([])
            setCursors([])
          }
        })
      } catch {
        // Socket unavailable - collaboration is optional
      }
    }

    init()

    return () => {
      cancelled = true
      if (socketRef.current) {
        socketRef.current.emit('leave:project', projectId)
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [projectId])

  const emitCursorMove = (position: { x: number; y: number }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('cursor:move', { projectId, position })
    }
  }

  return { collaborators, cursors, connected, emitCursorMove }
}

/* ─── Collaboration Bar ─────────────────────────────────────────────────── */

export function CollaborationBar({ projectId }: CollaborationIndicatorsProps) {
  const { collaborators, connected } = useCollaboration({ projectId })

  return (
    <div className="flex items-center gap-3">
      {/* Connection status */}
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-500'}`}
        />
        <span className="text-[10px] text-gray-500">
          {connected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Presence dots */}
      <PresenceDots collaborators={collaborators} />
    </div>
  )
}
