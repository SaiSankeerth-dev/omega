'use client'

import { useState, useEffect } from 'react'
import { useCommandPalette } from '@/components/CommandPalette'

/* ─── Navbar ────────────────────────────────────────────────────────────── */

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { open: openPalette } = useCommandPalette()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(0,0,0,0.4)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
            Ω Omega
          </span>
        </a>

        {/* Center nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Templates', 'AI Studio', 'Docs', 'Resources'].map((link) => (
            <a
              key={link}
              href={link === 'Templates' ? '/templates' : link === 'AI Studio' ? '/editor/new' : '#'}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Command palette trigger */}
          <button
            onClick={openPalette}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-all duration-200"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            aria-label="Open command palette"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <kbd className="text-[10px] text-gray-500 px-1 py-0.5 rounded border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              ⌘K
            </kbd>
          </button>

          <a
            href="/auth"
            className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth"
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  )
}

/* ─── Hero Section ──────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Large slow-moving blobs */}
        <div className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            animation: 'drift 20s ease-in-out infinite',
          }}
        />
        <div className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
            animation: 'drift 25s ease-in-out infinite reverse',
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 60%)',
            animation: 'drift 30s ease-in-out infinite',
          }}
        />

        {/* Particle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[2px] mb-6"
            style={{
              color: '#818cf8',
              backgroundColor: 'rgba(129,140,248,0.1)',
              border: '1px solid rgba(129,140,248,0.3)',
            }}
          >
            Omega Platform
          </span>
        </div>

        <h1 className="animate-fade-in-up-delay-1 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] mb-6">
          Build{' '}
          <span style={{ color: '#818cf8' }}>something</span>
          <br />
          extraordinary
        </h1>

        <p className="animate-fade-in-up-delay-2 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories — powered by AI, crafted by you.
        </p>

        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/auth"
            className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Get Started Free
          </a>
          <a
            href="#"
            className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
            }}
          >
            Watch Demo
          </a>
          <a
            href="/templates"
            className="inline-flex items-center px-8 py-3.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Explore Templates
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}

/* ─── Feature Cards ──────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: '📊', title: 'AI Presentations', description: 'Transform ideas into stunning slide decks with AI-powered design. Choose from hundreds of templates.' },
  { icon: '🌐', title: 'AI Websites', description: 'Launch beautiful, responsive websites in minutes. Customize every element with natural language.' },
  { icon: '📝', title: 'AI Documents', description: 'Generate polished documents, reports, and proposals. Smart formatting, intelligent suggestions.' },
  { icon: '🎬', title: 'Visual Stories', description: 'Create engaging visual narratives with AI-assisted design. Perfect for pitches and portfolios.' },
]

function FeatureCards() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything you need to create
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Four powerful creation tools. One seamless experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl transition-all duration-300 cursor-default"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-3xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── AI Prompt Section ──────────────────────────────────────────────────── */

const PLACEHOLDERS = [
  'Create a pitch deck for a quantum computing startup...',
  'Design a landing page for my SaaS product...',
  'Write a product roadmap for Q1 2025...',
  'Tell a brand story for an eco-friendly fashion line...',
]

function AIPromptSection() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            What will you create today?
          </h2>
          <p className="text-gray-400">
            Describe what you want, and Omega builds it.
          </p>
        </div>

        <div
          className="relative p-1 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3), rgba(139,92,246,0.3))',
          }}
        >
          <div className="bg-[#0a0a1a] rounded-2xl p-1">
            <div className="p-4">
              <textarea
                rows={4}
                placeholder={PLACEHOLDERS[placeholderIndex]}
                className="w-full bg-transparent resize-none text-white placeholder-gray-600 outline-none text-sm leading-relaxed"
                style={{ minHeight: '100px' }}
              />
            </div>
            <div className="flex items-center justify-between px-4 pb-4">
              <span className="text-xs text-gray-600">Powered by Omega AI</span>
              <button
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                Generate with AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */

function FooterSection() {
  return (
    <footer className="border-t px-6 py-12" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Ω Omega</span>
        </div>

        <div className="flex items-center gap-8">
          {['Docs', 'Privacy', 'Terms', 'Contact'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {link}
            </a>
          ))}
        </div>

        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Omega. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#050816]">
      <Navbar />
      <HeroSection />
      <FeatureCards />
      <AIPromptSection />
      <FooterSection />
    </main>
  )
}
