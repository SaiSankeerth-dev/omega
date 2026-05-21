'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Slide {
  id: string
  title: string
  content: string
  bg?: string
}

const TRANSITIONS = ['fade', 'slide-left', 'slide-right', 'zoom'] as const
type Transition = typeof TRANSITIONS[number]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function PresentationPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string

  const [currentSlide, setCurrentSlide] = useState(0)
  const [transition, setTransition] = useState<Transition>('fade')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showMinimap, setShowMinimap] = useState(false)
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mock slides for presentation mode
  const [slides] = useState<Slide[]>([
    { id: '1', title: 'Build Something Extraordinary', content: 'Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories.', bg: 'from-violet-600 to-indigo-900' },
    { id: '2', title: 'AI-Powered Creation', content: 'Transform ideas into stunning slide decks with AI-powered design. Choose from hundreds of templates.' },
    { id: '3', title: 'Real-Time Collaboration', content: 'Work together with your team in real-time. See live cursors, changes, and comments as they happen.', bg: 'from-emerald-600 to-teal-900' },
    { id: '4', title: 'Export Anywhere', content: 'Export your presentations as PDF, PPTX, HTML, or PNG. Share with a link or embed on your website.' },
    { id: '5', title: 'Enterprise Security', content: 'SOC2 compliant, end-to-end encrypted, and built for teams of any size.', bg: 'from-amber-600 to-orange-900' },
  ])

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return
    if (index < 0 || index >= slides.length) return

    const direction = index > currentSlide ? 'slide-left' : 'slide-right'
    setTransition(index > currentSlide ? 'slide-left' : 'slide-right')
    setIsTransitioning(true)
    setCurrentSlide(index)

    setTimeout(() => setIsTransitioning(false), 400)
  }, [currentSlide, slides.length, isTransitioning])

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo])
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo])

  // ── Keyboard navigation ────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Escape') {
        router.push(`/editor/${projectId}`)
      } else if (e.key === 'm') {
        setShowMinimap((v) => !v)
      } else if (e.key === 'f') {
        document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [next, prev, router, projectId])

  // ── Auto-hide controls ─────────────────────────────────────────────────
  useEffect(() => {
    const show = () => {
      setShowControls(true)
      if (controlsTimer.current) clearTimeout(controlsTimer.current)
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
    show()
    window.addEventListener('mousemove', show)
    return () => window.removeEventListener('mousemove', show)
  }, [])

  const slide = slides[currentSlide]!

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black overflow-hidden"
      onClick={() => setShowControls(!showControls)}
    >
      {/* Slide content */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-12 transition-all duration-500 ${
        transition === 'slide-left' ? '-translate-x-full opacity-0' :
        transition === 'slide-right' ? 'translate-x-full opacity-0' :
        transition === 'zoom' ? 'scale-50 opacity-0' : ''
      }`}
        style={{
          background: slide.bg
            ? `linear-gradient(135deg, ${slide.bg.split(' ')[0]}, ${slide.bg.split(' ')[1] || '#000'})`
            : '#0a0a1a',
          transitionDelay: isTransitioning ? '0s' : '0.1s',
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {slide.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {slide.content}
          </p>
        </div>

        {/* Slide number */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-white/40">
          {currentSlide + 1} / {slides.length}
        </div>
      </div>

      {/* Controls overlay */}
      <div className={`absolute inset-x-0 bottom-0 p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((currentSlide + 1) / slides.length) * 100}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                }}
              />
            </div>
            <span className="text-xs text-white/40 w-16 text-right">
              {currentSlide + 1}/{slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-6">
            <button onClick={prev} disabled={currentSlide === 0}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={next} disabled={currentSlide >= slides.length - 1}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button onClick={() => router.push(`/editor/${projectId}`)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="Exit (Esc)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Minimap */}
      {showMinimap && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-violet-500 scale-150' : 'bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      )}

      {/* Hint */}
      {showControls && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/30">
          Arrow keys to navigate · Esc to exit · F for fullscreen · M for minimap
        </div>
      )}
    </div>
  )
}
