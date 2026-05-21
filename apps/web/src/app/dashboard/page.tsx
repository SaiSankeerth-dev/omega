'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/auth'
import { useProjectsStore } from '@/store/projects'
import { useAIStore } from '@/store/ai'
import { useCommandPalette } from '@/components/CommandPalette'
import { NotificationBell } from '@/components/ui/Notifications'
import { ThemeToggle } from '@/components/ui/ThemeSwitcher'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { api } from '@/lib/api'
import { GlowingEffect } from '@/components/glowing-effect-card'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Project {
  id: string
  name: string
  type: 'presentation' | 'website' | 'document' | 'story'
  updatedAt: string
  workspaceId?: string | null
}

type ProjectType = 'all' | 'presentation' | 'website' | 'document' | 'story'

/* ─── Constants ─────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'AI Presentation', icon: '📊', type: 'presentation' as const },
  { label: 'AI Website', icon: '🌐', type: 'website' as const },
  { label: 'AI Document', icon: '📝', type: 'document' as const },
  { label: 'AI Story', icon: '🎬', type: 'story' as const },
]

const TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  presentation: { label: 'Presentation', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  website:      { label: 'Website',      color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  document:     { label: 'Document',     color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  story:        { label: 'Story',        color: '#f472b6', bg: 'rgba(244,182,114,0.12)' },
}

const TYPE_FILTERS: { value: ProjectType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'presentation', label: 'Presentations', icon: '📊' },
  { value: 'website', label: 'Websites', icon: '🌐' },
  { value: 'document', label: 'Documents', icon: '📝' },
  { value: 'story', label: 'Stories', icon: '🎬' },
]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, loadMe, logout } = useAuthStore()
  const { totalTokensUsed, fetchHistory } = useAIStore()
  const { open: openPalette } = useCommandPalette()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProjectType>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  // Share modal
  const [shareProjectId, setShareProjectId] = useState<string | null>(null)
  const [shareProjectName, setShareProjectName] = useState('')

  // Mobile sidebar
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/auth')
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      void fetchHistory()
    }
  }, [isAuthenticated, fetchHistory])

  // ── Fetch projects ────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true)
    try {
      const token = localStorage.getItem('omega_access_token')
      if (!token) { setProjectsLoading(false); return }

      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('limit', '50')

      const data = await api.get<{ data: Project[]; total: number }>(`/search/projects?${params.toString()}`, token)
      setProjects(data.data || [])
    } catch {
      // Fallback: try fetching from /projects directly
      try {
        const fallbackToken = localStorage.getItem('omega_access_token')
        if (!fallbackToken) { setProjects([]); return }
        const data = await api.get<{ projects: Project[] }>('/projects', fallbackToken)
        let filtered = data.projects || []
        if (typeFilter !== 'all') filtered = filtered.filter((p) => p.type === typeFilter)
        if (searchQuery) filtered = filtered.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        setProjects(filtered)
      } catch {
        setProjects([])
      }
    } finally {
      setProjectsLoading(false)
    }
  }, [searchQuery, typeFilter])

  useEffect(() => {
    if (!isAuthenticated) return
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [fetchProjects, isAuthenticated])

  // ── Actions ───────────────────────────────────────────────────────────
  const createProject = async (type: string) => {
    try {
      const token = localStorage.getItem('omega_access_token')
      const data = await api.post<{ project: Project }>('/projects', { name: `New ${type}`, type }, token ?? undefined)
      router.push(`/editor/${data.project.id}`)
    } catch {
      const fakeId = `new-${Date.now()}`
      router.push(`/editor/${fakeId}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth')
  }

  // ── Filtered projects (client-side fallback) ──────────────────────────
  const filteredProjects = useMemo(() => {
    let list = projects
    if (typeFilter !== 'all') list = list.filter((p) => p.type === typeFilter)
    if (searchQuery) list = list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return list
  }, [projects, typeFilter, searchQuery])

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'there'
  const TOKEN_LIMIT = 100_000
  const tokenPct = Math.min((totalTokensUsed / TOKEN_LIMIT) * 100, 100)

  return (
    <div className="min-h-screen bg-[var(--background,#050816)] flex">
      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed lg:static left-0 top-0 h-full z-30 flex flex-col border-r backdrop-blur-xl transition-all duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
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

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          <button onClick={openPalette} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-lg shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <span className={`flex items-center justify-between flex-1 transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
              <span>Search</span>
              <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>⌘K</kbd>
            </span>
          </button>

          <div className="my-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

          {[
            { icon: '🏠', label: 'Home', href: '/dashboard', active: true },
            { icon: '📁', label: 'Projects', href: '/dashboard', active: false },
            { icon: '📋', label: 'Templates', href: '/templates', active: false },
            { icon: '📊', label: 'Analytics', href: '/analytics', active: false },
            { icon: '🧩', label: 'Marketplace', href: '/marketplace', active: false },
            { icon: '⚡', label: 'Workflows', href: '/workflows', active: false },
            { icon: '✨', label: 'AI Studio', href: '#', active: false },
            { icon: '🏢', label: 'Workspaces', href: '/workspaces', active: false },
            { icon: '⚙️', label: 'Settings', href: '/settings', active: false },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                item.active ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
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
        <div className="px-2 pb-4">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
          >
            <span className="text-base shrink-0">🚪</span>
            <span className={`transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-x-hidden transition-all duration-300">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-white">
              {greeting}, {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <ThemeToggle />
            <a
              href="/editor/new"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              + New Project
            </a>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all"
            />
          </div>

          {/* Quick Actions */}
          <section>
            <h2 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 sm:mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  onClick={() => createProject(action.type)}
                  className="p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-xl sm:text-2xl mb-2 block">{action.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Filter Tabs */}
          <section>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Projects
              </h2>
              {filteredProjects.length > 0 && (
                <span className="text-[10px] sm:text-xs text-gray-600">{filteredProjects.length} total</span>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-1">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setTypeFilter(f.value)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                    typeFilter === f.value
                      ? 'text-white bg-violet-500/20 border-violet-500/50'
                      : 'text-gray-500 hover:text-gray-300 border-white/10 hover:bg-white/5'
                  } border`}
                  style={typeFilter === f.value ? { borderColor: 'rgba(139,92,246,0.5)' } : { borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <span className="text-xs">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Project Grid */}
            {projectsLoading ? (
              <SkeletonDashboard />
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <p className="text-sm text-gray-500 mb-2">
                  {searchQuery ? 'No projects match your search' : 'No projects yet'}
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => createProject('presentation')}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  >
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredProjects.map((project) => {
                  const badge = (TYPE_BADGES[project.type] || TYPE_BADGES.presentation)!
                  return (
                    <div
                      key={project.id}
                      className="relative rounded-2xl group"
                    >
                      <GlowingEffect
                        blur={8}
                        spread={40}
                        proximity={80}
                        glow={true}
                        borderWidth={2}
                        movementDuration={1.5}
                        disabled={false}
                      />

                      <div
                        className="relative z-10 p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onClick={() => router.push(`/editor/${project.id}`)}
                      >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span
                            className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full"
                            style={{ color: badge.color, backgroundColor: badge.bg }}
                          >
                            {badge.label}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShareProjectId(project.id)
                                setShareProjectName(project.name)
                              }}
                              className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all"
                              title="Share"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                              </svg>
                            </button>
                            <span className="text-[10px] sm:text-xs text-gray-600">{project.updatedAt}</span>
                          </div>
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-200 group-hover:text-white transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/editor/${project.id}`)
                            }}
                            className="text-[10px] sm:text-xs text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Open
                          </button>
                          <span className="text-gray-600 text-[10px]">·</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShareProjectId(project.id)
                              setShareProjectName(project.name)
                            }}
                            className="text-[10px] sm:text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* AI Usage */}
          <section>
            <h2 className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              AI Usage This Month
            </h2>
            <div className="p-4 sm:p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* ── Share Modal ──────────────────────────────────────────────────── */}
      {shareProjectId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShareProjectId(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 border shadow-2xl"
            style={{
              backgroundColor: '#0d0d1a',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Share &quot;{shareProjectName}&quot;</h3>
              <button onClick={() => setShareProjectId(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Share this project with others. Create a share link to get started.
            </p>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('omega_access_token')
                  const data = await api.post<{ shareLink: { url: string; token: string } }>(
                    '/share', { projectId: shareProjectId, permission: 'view' }, token ?? undefined,
                  )
                  const url = `${window.location.origin}/shared/${data.shareLink.token}`
                  await navigator.clipboard.writeText(url)
                  setShareProjectId(null)
                } catch {
                  // Silent
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Copy Share Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
