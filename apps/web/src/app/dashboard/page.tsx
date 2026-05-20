'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { useProjectsStore } from '@/store/projects'
import { useAIStore } from '@/store/ai'
import { useCommandPalette } from '@/components/CommandPalette'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ProjectType = 'presentation' | 'website' | 'document' | 'story'

const TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  presentation: { label: 'Presentation', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  website:      { label: 'Website',      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  document:     { label: 'Document',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  story:        { label: 'Story',        color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
}

const PROJECT_TYPE_ICONS: Record<string, string> = {
  presentation: '📊',
  website:      '🌐',
  document:     '📝',
  story:        '🎬',
}

const QUICK_ACTIONS: { label: string; icon: string; type: ProjectType }[] = [
  { label: 'AI Presentation', icon: '📊', type: 'presentation' },
  { label: 'AI Website',      icon: '🌐', type: 'website' },
  { label: 'AI Document',     icon: '📝', type: 'document' },
  { label: 'AI Story',        icon: '🎬', type: 'story' },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function guessType(name: string): ProjectType {
  const n = name.toLowerCase()
  if (n.includes('slide') || n.includes('deck') || n.includes('pitch') || n.includes('present')) return 'presentation'
  if (n.includes('web') || n.includes('site') || n.includes('landing') || n.includes('page')) return 'website'
  if (n.includes('story') || n.includes('brand') || n.includes('film') || n.includes('video')) return 'story'
  return 'document'
}

/* ─── Create Project Modal ───────────────────────────────────────────────── */

function NewProjectModal({
  defaultType,
  onClose,
  onCreate,
}: {
  defaultType: ProjectType
  onClose: () => void
  onCreate: (name: string, type: ProjectType) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>(defaultType)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    try {
      await onCreate(name.trim(), type)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 border shadow-2xl animate-scale-in"
        style={{ backgroundColor: '#0d0d1a', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-1">New Project</h3>
        <p className="text-xs text-gray-500 mb-5">Give your project a name to get started.</p>

        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q4 Investor Pitch"
          className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 border border-white/10 focus:border-violet-500/40 outline-none transition-all mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
        />

        <div className="grid grid-cols-4 gap-2 mb-5">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.type}
              onClick={() => setType(a.type)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center transition-all"
              style={{
                backgroundColor: type === a.type ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${type === a.type ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <span className="text-lg">{a.icon}</span>
              <span className="text-[10px] text-gray-400" style={{ color: type === a.type ? '#a78bfa' : undefined }}>
                {a.label.replace('AI ', '')}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="btn-brand px-5 py-2 rounded-xl text-xs flex items-center gap-2"
          >
            {loading ? (
              <><div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />Creating…</>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main dashboard ─────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, loadMe, logout } = useAuthStore()
  const { projects, isLoading: projectsLoading, fetchProjects, createProject, deleteProject } = useProjectsStore()
  const { totalTokensUsed, fetchHistory } = useAIStore()

  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [newProjectModal, setNewProjectModal] = useState<{ open: boolean; type: ProjectType }>({
    open: false,
    type: 'presentation',
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => { void loadMe() }, [loadMe])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/auth')
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      void fetchProjects()
      void fetchHistory()
    }
  }, [isAuthenticated, fetchProjects, fetchHistory])

  const { open: openPalette } = useCommandPalette()

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  const handleCreate = useCallback(async (name: string, _type: ProjectType) => {
    const project = await createProject({ name, description: undefined })
    setNewProjectModal({ open: false, type: 'presentation' })
    router.push(`/editor/${project.id}`)
  }, [createProject, router])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deleteProject(id)
    } finally {
      setDeletingId(null)
    }
  }

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'there'
  const TOKEN_LIMIT = 100_000
  const tokenPct = Math.min((totalTokensUsed / TOKEN_LIMIT) * 100, 100)

  return (
    <div className="min-h-screen bg-[#050816] flex">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-full z-30 flex flex-col border-r backdrop-blur-xl transition-all duration-300"
        style={{
          width: sidebarExpanded ? '200px' : '64px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xl font-bold text-white shrink-0">Ω</span>
          <span className={`ml-3 text-sm font-semibold text-white transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
            Omega
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          <button
            onClick={openPalette}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <span className={`flex items-center justify-between flex-1 transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
              <span>Search</span>
              <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>⌘K</kbd>
            </span>
          </button>

          <div className="my-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {[
            { icon: '🏠', label: 'Home',      href: '/dashboard', active: true },
            { icon: '📁', label: 'Projects',  href: '/dashboard', active: false },
            { icon: '📋', label: 'Templates', href: '/templates', active: false },
            { icon: '✨', label: 'AI Studio', href: '#',          active: false },
            { icon: '⚙️', label: 'Settings',  href: '#',          active: false },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                item.active ? 'text-white bg-white/5' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className={`transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200"
          >
            <span className="text-base shrink-0">🚪</span>
            <span className={`transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 transition-all duration-300 overflow-auto"
        style={{ marginLeft: sidebarExpanded ? '200px' : '64px' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-8 border-b backdrop-blur-xl" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(5,8,22,0.8)' }}>
          <h1 className="text-base font-semibold text-white">
            {greeting}, <span className="text-violet-300">{displayName}</span> 👋
          </h1>
          <button
            onClick={() => setNewProjectModal({ open: true, type: 'presentation' })}
            className="btn-brand px-4 py-2 rounded-xl text-sm"
          >
            + New Project
          </button>
        </header>

        {/* Content */}
        <div className="p-8 space-y-10 max-w-6xl mx-auto">

          {/* Quick Actions */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Start</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  onClick={() => setNewProjectModal({ open: true, type: action.type })}
                  className="p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] group glass-card"
                >
                  <span className="text-2xl mb-2 block">{action.icon}</span>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Projects</h2>
              <span className="text-xs text-gray-600">{projects.length} total</span>
            </div>

            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-28 rounded-2xl skeleton" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl text-center glass-card"
              >
                <span className="text-4xl mb-3">🚀</span>
                <p className="text-sm font-medium text-gray-300 mb-1">No projects yet</p>
                <p className="text-xs text-gray-600 mb-4">Create your first project to get started</p>
                <button
                  onClick={() => setNewProjectModal({ open: true, type: 'presentation' })}
                  className="btn-brand px-5 py-2 rounded-xl text-xs"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const type = guessType(project.name)
                  const badge = TYPE_BADGES[type]!
                  return (
                    <div
                      key={project.id}
                      className="p-5 rounded-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02] glass-card group relative"
                      onClick={() => router.push(`/editor/${project.id}`)}
                    >
                      {/* Delete btn */}
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        disabled={deletingId === project.id}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {deletingId === project.id ? (
                          <div className="w-3 h-3 rounded-full border border-red-400/40 border-t-red-400 animate-spin" />
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                          </svg>
                        )}
                      </button>

                      <div className="flex items-center justify-between mb-3 pr-6">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5"
                          style={{ color: badge.color, backgroundColor: badge.bg }}
                        >
                          <span>{PROJECT_TYPE_ICONS[type]}</span>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-gray-600">{formatRelative(project.updatedAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors leading-snug">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{project.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* AI Usage */}
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">AI Usage This Month</h2>
            <div className="p-6 rounded-2xl glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Tokens used</span>
                <span className="text-sm text-gray-300 font-medium">
                  {totalTokensUsed.toLocaleString()} / {TOKEN_LIMIT.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${tokenPct}%`,
                    background: tokenPct > 80
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-600 mt-2">
                {tokenPct < 80
                  ? `${(TOKEN_LIMIT - totalTokensUsed).toLocaleString()} tokens remaining`
                  : 'Approaching limit — consider upgrading'}
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Modal */}
      {newProjectModal.open && (
        <NewProjectModal
          defaultType={newProjectModal.type}
          onClose={() => setNewProjectModal({ open: false, type: 'presentation' })}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
