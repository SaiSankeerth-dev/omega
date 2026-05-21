'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { useToast } from '@/components/ToastProvider'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SkeletonCard } from '@/components/ui/Skeleton'

interface Workspace {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadMe, logout } = useAuthStore()
  const { toast } = useToast()

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth')
      return
    }
    if (!isLoading) {
      fetchWorkspaces()
    }
  }, [isAuthenticated, isLoading, router])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      const data = await api.get<{ workspaces: Workspace[] }>('/workspaces', token ?? undefined)
      setWorkspaces(data.workspaces)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      const data = await api.post<{ workspace: Workspace }>('/workspaces', { name: newName }, token ?? undefined)
      setWorkspaces((prev) => [...prev, data.workspace])
      setNewName('')
      setShowCreate(false)
      toast('Workspace created', 'success')
    } catch {
      toast('Failed to create workspace', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050816]">
      <header className="flex items-center justify-between h-14 px-4 sm:px-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Workspaces' },
          ]} />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          + New Workspace
        </button>
      </header>

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No workspaces yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="p-5 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                onClick={() => router.push(`/dashboard?workspace=${ws.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{ws.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">/{ws.slug}</p>
                  </div>
                  <span className="text-[10px] text-gray-600">
                    Created {new Date(ws.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowCreate(false)}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 border shadow-2xl"
            style={{ backgroundColor: '#0d0d1a', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-1">New Workspace</h3>
            <p className="text-xs text-gray-500 mb-4">Organize your projects into workspaces.</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
              placeholder="Workspace name..."
              className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
