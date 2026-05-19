'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Project {
  id: string
  name: string
  type: 'presentation' | 'website' | 'document' | 'story'
  updatedAt: string
}

/* ─── Mock data ─────────────────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'AI Presentation', icon: '📊', type: 'presentation' as const },
  { label: 'AI Website', icon: '🌐', type: 'website' as const },
  { label: 'AI Document', icon: '📝', type: 'document' as const },
  { label: 'AI Story', icon: '🎬', type: 'story' as const },
]

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Q4 Pitch Deck', type: 'presentation', updatedAt: '2 hours ago' },
  { id: '2', name: 'Landing Page Redesign', type: 'website', updatedAt: 'Yesterday' },
  { id: '3', name: 'Product Roadmap', type: 'document', updatedAt: '3 days ago' },
  { id: '4', name: 'Brand Story', type: 'story', updatedAt: '1 week ago' },
  { id: '5', name: 'Investor Summary', type: 'presentation', updatedAt: '2 weeks ago' },
  { id: '6', name: 'API Documentation', type: 'document', updatedAt: '3 weeks ago' },
]

const TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  presentation: { label: 'Presentation', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  website: { label: 'Website', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  document: { label: 'Document', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  story: { label: 'Story', color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
} as const

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    /* Validate token on mount */
    const token = localStorage.getItem('omega_token')
    if (!token) {
      router.replace('/auth')
      return
    }

    /* If no user in store, try fetching from API */
    if (!user) {
      fetch('http://localhost:3001/api/auth/me' /* TODO: use NEXT_PUBLIC_API_URL from env */, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data?.user) {
            setUser({
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name ?? null,
              avatarUrl: data.data.user.avatarUrl ?? null,
              createdAt: data.data.user.createdAt ? new Date(data.data.user.createdAt) : new Date(),
              updatedAt: new Date(),
            })
          }
        })
        .catch(() => {})
    }
  }, [router, user, setUser])

  const handleLogout = () => {
    localStorage.removeItem('omega_token')
    setUser(null)
    router.push('/auth')
  }

  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'there'

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
        <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xl font-bold text-white shrink-0">Ω</span>
          <span className={`ml-3 text-sm font-semibold text-white transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
            Omega
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {[
            { icon: '🏠', label: 'Home', active: true },
            { icon: '📁', label: 'Projects', active: false },
            { icon: '📋', label: 'Templates', active: false },
            { icon: '✨', label: 'AI Studio', active: false },
            { icon: '⚙️', label: 'Settings', active: false },
          ].map((item) => (
            <a
              key={item.label}
              href={item.label === 'Templates' ? '/templates' : '#'}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                item.active
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <span className={`transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200"
          >
            <span className="text-lg shrink-0">🚪</span>
            <span className={`transition-opacity duration-200 ${sidebarExpanded ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 ml-16 transition-all duration-300" style={{ marginLeft: sidebarExpanded ? '200px' : '64px' }}>
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="text-lg font-semibold text-white">
            {greeting}, {displayName}
          </h1>
          <a
            href="/editor/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            + New Project
          </a>
        </header>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Quick Actions */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.type}
                  className="p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] group"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span className="text-2xl mb-2 block">{action.icon}</span>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent Projects */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Projects</h2>
              <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PROJECTS.map((project) => {
                const badge = TYPE_BADGES[project.type]!
                return (
                  <div
                    key={project.id}
                    className="p-5 rounded-2xl transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ color: badge.color, backgroundColor: badge.bg }}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-600">{project.updatedAt}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200">{project.name}</h3>
                  </div>
                )
              })}
            </div>
          </section>

          {/* AI Usage Widget */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">AI Usage This Month</h2>
            <div
              className="p-6 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Tokens used</span>
                <span className="text-sm text-gray-300">24,560 / 100,000</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: '24.5%',
                    background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
