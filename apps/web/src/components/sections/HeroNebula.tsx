'use client'

import { useRef, useEffect, useCallback } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Particle {
  x: number
  y: number
  z: number
  hue: number
  size: number
  baseOpacity: number
  twinkleSpeed: number
  twinkleOffset: number
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const PARTICLE_COUNT = 2000
const HUE_MIN = 220
const HUE_MAX = 300
const MOUSE_RADIUS = 220
const MOUSE_FORCE = 0.6
const TRAIL_ALPHA = 0.12
const GLOW_RADIUS_FACTOR = 0.45
const VORTEX_BASE_SPEED = 0.35

/* ─── Particle factory ──────────────────────────────────────────────────── */

function createParticle(width: number, height: number): Particle {
  const cx = width / 2
  const cy = height / 2
  const maxR = Math.min(width, height) * GLOW_RADIUS_FACTOR

  // Spiral arm distribution: radius weighted toward center, then offset angle
  const radius = Math.pow(Math.random(), 0.55) * maxR
  const angle = Math.random() * Math.PI * 2 + radius * 0.018

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    z: Math.random(),
    hue: HUE_MIN + Math.random() * (HUE_MAX - HUE_MIN),
    size: 0.6 + Math.random() * 2.8,
    baseOpacity: 0.25 + Math.random() * 0.75,
    twinkleSpeed: 0.5 + Math.random() * 2.5,
    twinkleOffset: Math.random() * Math.PI * 2,
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function drawStaticFrame(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  w: number,
  h: number,
  cx: number,
  cy: number,
  maxR: number,
): void {
  ctx.fillStyle = '#020212'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particles[i]!
    const sz = p.size * (0.4 + p.z * 0.6)
    ctx.beginPath()
    ctx.arc(p.x, p.y, sz, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.baseOpacity * 0.5})`
    ctx.fill()
  }

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
  grad.addColorStop(0, 'rgba(99,102,241,0.08)')
  grad.addColorStop(0.5, 'rgba(99,102,241,0.04)')
  grad.addColorStop(1, 'rgba(99,102,241,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function HeroNebula() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })

  /* ── Bootstrap canvas & animation ─────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /* set initial size */
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    /* create particles */
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h),
    )

    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) * GLOW_RADIUS_FACTOR

    /* ── Check reduced motion ──────────────────────────────────────────── */
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      drawStaticFrame(ctx, particles, w, h, cx, cy, maxR)
      return
    }

    /* ctx is narrowed to non-null by the check above; assign to a non-nullable alias for closure safety */
    const c: CanvasRenderingContext2D = ctx

    let animationId: number

    /* ── Frame renderer ─────────────────────────────────────────────────── */
    function render(time: number) {
      const t = time / 1000
      const mouse = mouseRef.current

      /* --- trail --- */
      c.fillStyle = `rgba(2,2,18,${TRAIL_ALPHA})`
      c.fillRect(0, 0, w, h)

      /* --- update & draw particles --- */
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]!

        /* vortex rotation (differential — outer orbits slower) */
        const dx = p.x - cx
        const dy = p.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const rotSpeed = VORTEX_BASE_SPEED / (1 + (dist / maxR) * 2.5)
        const angle = Math.atan2(dy, dx) + rotSpeed * 0.016

        p.x = cx + Math.cos(angle) * dist
        p.y = cy + Math.sin(angle) * dist

        /* mouse attraction */
        const mdx = mouse.x - p.x
        const mdy = mouse.y - p.y
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy)

        if (mDist < MOUSE_RADIUS && mDist > 0) {
          const force = (1 - mDist / MOUSE_RADIUS) * MOUSE_FORCE * 0.016
          p.x += mdx * force
          p.y += mdy * force
        }

        /* twinkle */
        const twinkle =
          Math.sin(t * p.twinkleSpeed + p.twinkleOffset) * 0.35 + 0.65
        const opacity = p.baseOpacity * twinkle
        const sz = p.size * (0.4 + p.z * 0.6)

        c.beginPath()
        c.arc(p.x, p.y, sz, 0, Math.PI * 2)
        c.fillStyle = `hsla(${p.hue},80%,65%,${opacity})`
        c.fill()
      }

      /* --- central glow --- */
      const grad = c.createRadialGradient(cx, cy, 0, cx, cy, maxR)
      grad.addColorStop(0, 'rgba(99,102,241,0.08)')
      grad.addColorStop(0.5, 'rgba(99,102,241,0.04)')
      grad.addColorStop(1, 'rgba(99,102,241,0)')
      c.fillStyle = grad
      c.fillRect(0, 0, w, h)

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    /* ── Resize handler ─────────────────────────────────────────────────── */
    /* canvas is also narrowed by the early return; assign alias for closure safety */
    const cnvs: HTMLCanvasElement = canvas

    function handleResize() {
      w = window.innerWidth
      h = window.innerHeight
      cnvs.width = w
      cnvs.height = h
      /* repopulate particles for new dimensions */
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles[i] = createParticle(w, h)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  /* ── Mouse handlers ──────────────────────────────────────────────────── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: -1000, y: -1000 }
  }, [])

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <section
      className="relative w-full h-dvh overflow-hidden select-none bg-[#020212]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Hero"
    >
      {/* ── Canvas layer ───────────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      />

      {/* ── Overlay content ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4"
        style={{ pointerEvents: 'none' }}
      >
        {/* Badge pill */}
        <div className="animate-fade-in-up mb-6">
          <span
            className="inline-block rounded-full border px-4 py-1.5 text-[11px] font-medium uppercase leading-none tracking-[2px] text-[#818cf8]"
            style={{
              backgroundColor: 'rgba(129,140,248,0.1)',
              borderColor: 'rgba(129,140,248,0.3)',
            }}
          >
            Omega Platform
          </span>
        </div>

        {/* Heading */}
        <h1
          className="animate-fade-in-up-delay-1 text-center font-bold leading-[1.15] tracking-[-2px] text-white"
          style={{ fontSize: 'clamp(36px, 8vw, 64px)' }}
        >
          Build{' '}
          <span className="text-[#818cf8]">something</span>{' '}
          extraordinary
        </h1>

        {/* Subheading */}
        <p
          className="animate-fade-in-up-delay-2 mt-6 max-w-[480px] text-center text-[17px] leading-relaxed text-[rgba(255,255,255,0.5)]"
        >
          Production-grade SaaS infrastructure. Scale from zero to
          millions — without limits.
        </p>

        {/* CTAs */}
        <div
          className="animate-fade-in-up-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row"
          style={{ pointerEvents: 'auto' }}
        >
          <a
            href="/get-started"
            className="inline-flex items-center justify-center rounded-[10px] bg-[#818cf8] px-8 py-[13px] text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6366f1] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#818cf8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020212]"
          >
            Get started free
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.2)] px-8 py-[13px] text-[15px] font-semibold text-[rgba(255,255,255,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020212]"
          >
            View docs &rarr;
          </a>
        </div>
      </div>

      {/* ── Scroll indicator ────────────────────────────────────────────── */}
      <div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-[rgba(255,255,255,0.3)]"
        aria-hidden="true"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-8 right-6 z-10 hidden items-center gap-8 sm:flex md:right-10">
        {[
          { value: '99.9%', label: 'Uptime' },
          { value: '10ms', label: 'Latency' },
          { value: 'SOC2', label: 'Certified' },
        ].map((stat) => (
          <div key={stat.label} className="text-right">
            <div
              className="text-lg font-semibold leading-tight text-white"
              style={{ fontSize: '18px' }}
            >
              {stat.value}
            </div>
            <div className="text-[10px] font-medium uppercase leading-tight tracking-[1px] text-[rgba(255,255,255,0.35)]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
