'use client'

import { useState, useMemo } from 'react'

/* ─── Types & Data ──────────────────────────────────────────────────────── */

interface Template {
  id: string
  name: string
  description: string
  category: string
  gradient: string
  featured?: boolean
}

const ALL_TEMPLATES: Template[] = [
  { id: '1', name: 'Pitch Deck Pro', description: 'Investor-ready pitch deck with modern layout', category: 'Presentations', gradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)', featured: true },
  { id: '2', name: 'SaaS Landing Page', description: 'High-converting landing page for startups', category: 'Websites', gradient: 'linear-gradient(135deg, #059669, #047857)', featured: true },
  { id: '3', name: 'Brand Story', description: 'Tell your brand story with cinematic visuals', category: 'Presentations', gradient: 'linear-gradient(135deg, #d97706, #b45309)', featured: true },
  { id: '4', name: 'Product Roadmap', description: 'Visual roadmap for product planning', category: 'Documents', gradient: 'linear-gradient(135deg, #6366f1, #4338ca)' },
  { id: '5', name: 'Portfolio Showcase', description: 'Creative portfolio to showcase your work', category: 'Websites', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
  { id: '6', name: 'Startup One-Pager', description: 'Clean one-page summary for your startup', category: 'Documents', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
  { id: '7', name: 'Social Media Kit', description: 'Branded social media graphics pack', category: 'Presentations', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
  { id: '8', name: 'E-Commerce Store', description: 'Modern e-commerce storefront template', category: 'Websites', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { id: '9', name: 'Investor Memo', description: 'Professional investor memorandum', category: 'Documents', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { id: '10', name: 'Agency Portfolio', description: 'Full agency portfolio with case studies', category: 'Portfolios', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { id: '11', name: 'Startup Pitch', description: 'Quick startup pitch for accelerator demos', category: 'Presentations', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { id: '12', name: 'Personal Brand', description: 'Personal brand website for professionals', category: 'Portfolios', gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
]

const CATEGORIES = ['All', 'Presentations', 'Websites', 'Documents', 'Portfolios', 'Startups']

/* ─── TemplateCard ──────────────────────────────────────────────────────── */

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer border"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Preview area */}
      <div className="aspect-[16/9] relative overflow-hidden"
        style={{ background: template.gradient }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-black/40 text-white/80">
          {template.category}
        </span>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white backdrop-blur-xl transition-all hover:scale-105"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{template.description}</p>
        <button
          className="w-full px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white border transition-all"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          Use Template
        </button>
      </div>
    </div>
  )
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = useMemo(() => {
    return ALL_TEMPLATES.filter((t) => {
      const matchCategory = activeCategory === 'All' || t.category === activeCategory
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [activeCategory, search])

  const featured = ALL_TEMPLATES.filter((t) => t.featured)

  return (
    <main className="min-h-screen bg-[#050816]">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-white" style={{ textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>Ω Omega</span>
            </a>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="/dashboard" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Dashboard</a>
              <a href="/auth"
                className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >Get Started</a>
            </div>
        </nav>
      </header>

      <div className="pt-14">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Template Library</h1>
          <p className="text-sm text-gray-400">Start with a professionally designed template and make it your own.</p>
        </div>

        {/* ── Featured Banner ────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Featured Templates</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {featured.map((t) => (
              <div
                key={t.id}
                className="shrink-0 w-72 rounded-2xl overflow-hidden cursor-pointer group border transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="aspect-[16/9] relative" style={{ background: t.gradient }}>
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-black/40 text-white/80">Featured</span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Search + Filters ──────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pb-6">
          {/* Search */}
          <div className="relative mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                style={{
                  backgroundColor: activeCategory === cat ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${activeCategory === cat ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Template Grid ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-6 pb-16">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500">No templates found matching your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
