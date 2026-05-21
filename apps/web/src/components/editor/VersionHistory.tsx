'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface Version {
  id: string
  version: number
  title: string
  message: string
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

interface VersionHistoryProps {
  projectId: string
  onRestore?: (version: Version) => void
}

export function VersionHistory({ projectId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    loadVersions()
  }, [projectId])

  const loadVersions = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/versions/${projectId}`)
      const data = await res.json()
      if (data.success) {
        setVersions(data.data ?? data.versions ?? [])
      } else {
        setError(data.error || 'Failed to load versions')
      }
    } catch {
      setError('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (version: Version) => {
    setRestoringId(version.id)
    try {
      const res = await fetch(`/api/versions/${projectId}/${version.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) {
        onRestore?.(version)
      }
    } catch {
      // silent fail
    } finally {
      setRestoringId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-red-400">{error}</p>
        <button onClick={loadVersions} className="mt-2 text-xs text-violet-400 hover:text-violet-300">
          Retry
        </button>
      </div>
    )
  }

  if (versions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">No version history yet</p>
        <p className="text-[10px] text-gray-600 mt-1">Versions are saved automatically as you edit</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Version History
        </h3>
        <button onClick={loadVersions} className="text-[10px] text-gray-600 hover:text-gray-400">
          Refresh
        </button>
      </div>
      {versions.map((version) => (
        <div
          key={version.id}
          className="group flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-violet-400">v{version.version}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">
              {version.title || `Version ${version.version}`}
            </p>
            {version.message && (
              <p className="text-[10px] text-gray-600 truncate mt-0.5">{version.message}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-600">
                {formatDate(version.createdAt)}
              </span>
              {version.user && (
                <span className="text-[10px] text-gray-600">
                  by {version.user.name || version.user.email}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleRestore(version)}
            disabled={restoringId === version.id}
            className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded text-[10px] font-medium text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all disabled:opacity-50"
          >
            {restoringId === version.id ? '...' : 'Restore'}
          </button>
        </div>
      ))}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
