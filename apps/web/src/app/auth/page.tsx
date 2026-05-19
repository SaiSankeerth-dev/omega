'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string | null
    createdAt?: string
  }
  token: string
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function AuthPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  /* Redirect if already logged in */
  useEffect(() => {
    const token = localStorage.getItem('omega_token')
    if (token) router.replace('/dashboard')
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const body: Record<string, string> = {
      email: emailRef.current?.value ?? '',
      password: passwordRef.current?.value ?? '',
    }
    if (mode === 'register') {
      body.name = nameRef.current?.value ?? ''
    }

    try {
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error?.message ?? data.error ?? 'Something went wrong. Please try again.'
        setError(msg)
        return
      }

      const { user, token } = data.data as AuthResponse
      localStorage.setItem('omega_token', token)
      setUser({ id: user.id, email: user.email, name: user.name ?? null, avatarUrl: null, createdAt: new Date(), updatedAt: new Date() })
      router.push('/dashboard')
    } catch {
      setError('Network error. Make sure the server is running on port 3001.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050816]">
      {/* ── Animated gradient blobs ──────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[100px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px] animate-pulse-slow-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-slower" />
      </div>

      {/* ── Auth card ──────────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-md mx-4 backdrop-blur-xl rounded-2xl border p-8 shadow-2xl"
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold tracking-tight text-white" style={{ textShadow: '0 0 20px rgba(139,92,246,0.5)' }}>
            Ω Omega
          </span>
        </div>

        {/* Tab switcher */}
        <div className="relative flex bg-white/5 rounded-xl p-1 mb-8">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                mode === m ? 'text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
          {/* Sliding indicator */}
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-violet-600/30 transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${mode === 'login' ? '0' : 'calc(100% + 8px)'})` }}
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl border text-sm" style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            borderColor: 'rgba(239,68,68,0.25)',
            color: '#f87171',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <FloatingInput
              ref={nameRef}
              label="Full name"
              type="text"
              autoComplete="name"
            />
          )}

          <FloatingInput
            ref={emailRef}
            label="Email address"
            type="email"
            autoComplete="email"
          />

          <FloatingInput
            ref={passwordRef}
            label="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {mode === 'register' && (
            <p className="text-xs text-gray-500">At least 8 characters</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            }}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Social login */}
        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 text-gray-500" style={{ backgroundColor: '#050816' }}>Or continue with</span>
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { name: 'Google', icon: 'G' },
              { name: 'GitHub', icon: 'GH' },
            ].map((provider) => (
              <button
                key={provider.name}
                onClick={() => alert(`${provider.name} login coming soon!`)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {provider.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─── Floating Input Component ─────────────────────────────────────────── */

function FloatingInput({
  ref,
  label,
  type,
  autoComplete,
}: {
  ref: React.RefObject<HTMLInputElement | null>
  label: string
  type: string
  autoComplete: string
}) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        type={type}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); setHasValue(!!e.target.value) }}
        onChange={(e) => setHasValue(!!e.target.value)}
        className="w-full px-4 pt-5 pb-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.12)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
        }}
      />
      <label
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          focused || hasValue
            ? 'top-1.5 text-[10px] text-violet-400'
            : 'top-3.5 text-sm text-gray-500'
        }`}
      >
        {label}
      </label>
    </div>
  )
}
