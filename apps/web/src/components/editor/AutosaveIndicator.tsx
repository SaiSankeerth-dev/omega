'use client'

import { useEffect, useRef, useState } from 'react'

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface AutosaveIndicatorProps {
  status: SaveStatus
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  const colorMap: Record<SaveStatus, string> = {
    saved: 'bg-emerald-500',
    saving: 'bg-amber-500',
    unsaved: 'bg-gray-500',
    error: 'bg-red-500',
  }

  const labelMap: Record<SaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving...',
    unsaved: 'Unsaved',
    error: 'Save failed',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[status]} transition-all duration-300`} />
      <span className="text-[10px] text-gray-500">{labelMap[status]}</span>
    </div>
  )
}

// ── Autosave hook ──────────────────────────────────────────────────────

interface UseAutosaveOptions {
  projectId: string
  getContent: () => any
  delay?: number
  onSave?: () => void
}

export function useAutosave({ projectId, getContent, delay = 2000, onSave }: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDirtyRef = useRef(false)

  const markDirty = () => {
    isDirtyRef.current = true
    setStatus('unsaved')

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        const content = getContent()
        const res = await fetch(`/api/editor/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        const data = await res.json()
        if (data.success) {
          setStatus('saved')
          isDirtyRef.current = false
          onSave?.()
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    }, delay)
  }

  const saveNow = async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setStatus('saving')
    try {
      const content = getContent()
      const res = await fetch(`/api/editor/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('saved')
        isDirtyRef.current = false
        onSave?.()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    status,
    isDirty: isDirtyRef.current,
    markDirty,
    saveNow,
  }
}
