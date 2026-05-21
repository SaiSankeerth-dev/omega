'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'

interface Cursor {
  userId: string
  email: string
  socketId: string
  position: { x: number; y: number } | null
  color?: string
}

const CURSOR_COLORS = [
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b',
  '#3b82f6', '#10b981', '#ef4444', '#06b6d4',
]

function getColorForUser(userId: string): string {
  const index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CURSOR_COLORS[index % CURSOR_COLORS.length]!
}

interface PresenceCursorsProps {
  projectId: string
  currentUserId: string
  socket?: Socket | null
}

export function PresenceCursors({ projectId, currentUserId, socket: externalSocket }: PresenceCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map())
  const [collaborators, setCollaborators] = useState<Cursor[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (externalSocket) {
      setSocket(externalSocket)
      return
    }

    const s = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '' },
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => {
      s.emit('join:project', projectId)
    })

    setSocket(s)

    return () => {
      s.emit('leave:project', projectId)
      s.disconnect()
    }
  }, [projectId, externalSocket])

  useEffect(() => {
    if (!socket) return

    const handleCursorMoved = (data: any) => {
      if (data.userId === currentUserId) return
      setCursors(prev => {
        const next = new Map(prev)
        next.set(data.socketId, {
          userId: data.userId,
          email: data.email,
          socketId: data.socketId,
          position: data.position,
          color: getColorForUser(data.userId),
        })
        return next
      })
    }

    const handleUserLeft = (data: any) => {
      setCursors(prev => {
        const next = new Map(prev)
        next.delete(data.socketId)
        return next
      })
      setCollaborators(prev => prev.filter(c => c.socketId !== data.socketId))
    }

    const handleUserJoined = (data: any) => {
      setCollaborators(prev => {
        if (prev.some(c => c.socketId === data.socketId)) return prev
        return [...prev, { ...data, position: null, color: getColorForUser(data.userId) }]
      })
    }

    const handleRoomCollaborators = (data: any[]) => {
      setCollaborators(data.map(c => ({
        ...c,
        position: null,
        color: getColorForUser(c.userId),
      })))
    }

    socket.on('cursor:moved', handleCursorMoved)
    socket.on('user:left', handleUserLeft)
    socket.on('user:joined', handleUserJoined)
    socket.on('room:collaborators', handleRoomCollaborators)

    return () => {
      socket.off('cursor:moved', handleCursorMoved)
      socket.off('user:left', handleUserLeft)
      socket.off('user:joined', handleUserJoined)
      socket.off('room:collaborators', handleRoomCollaborators)
    }
  }, [socket, currentUserId])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!socket) return
    socket.emit('cursor:move', {
      projectId,
      position: { x: e.clientX, y: e.clientY },
    })
  }, [socket, projectId])

  return (
    <>
      {/* Remote cursors overlay */}
      <div className="fixed inset-0 pointer-events-none z-50" onMouseMove={handleMouseMove}>
        {Array.from(cursors.values()).map((cursor) =>
          cursor.position ? (
            <div
              key={cursor.socketId}
              className="absolute transition-all duration-150 ease-linear pointer-events-none"
              style={{
                left: cursor.position.x,
                top: cursor.position.y,
                transform: 'translate(-2px, -2px)',
              }}
            >
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path
                  d="M1 1L10.5 9.5L7.5 10L10 13L8.5 13.5L6 10.5L4.5 13L3.5 12L5.5 9L1 7.5L1 1Z"
                  fill={cursor.color ?? '#8b5cf6'}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="0.5"
                />
              </svg>
              <span
                className="absolute left-3 top-0 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{
                  backgroundColor: cursor.color ?? '#8b5cf6',
                  color: '#fff',
                }}
              >
                {cursor.email.split('@')[0]}
              </span>
            </div>
          ) : null
        )}
      </div>

      {/* Collaborator avatars */}
      <div className="flex items-center -space-x-2">
        {collaborators.filter(c => c.userId !== currentUserId).map((c) => (
          <div
            key={c.socketId}
            className="w-7 h-7 rounded-full border-2 border-[#0d0d1a] flex items-center justify-center text-[10px] font-bold text-white"
            style={{ backgroundColor: c.color ?? '#8b5cf6' }}
            title={c.email}
          >
            {c.email.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </>
  )
}
