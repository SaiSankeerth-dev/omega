'use client'

import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#050816] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL or navigate back to a known page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 border border-white/10 hover:bg-white/5 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
