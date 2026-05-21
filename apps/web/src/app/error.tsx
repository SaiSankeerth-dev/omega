'use client'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold mb-4" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          500
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-400 mb-2 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
        </p>
        <p className="text-xs text-gray-600 mb-8 font-mono max-w-sm mx-auto truncate">
          {error.message || 'Unknown error'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
          >
            Dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
