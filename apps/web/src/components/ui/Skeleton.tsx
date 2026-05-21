'use client'

/* ─── Skeleton Base ─────────────────────────────────────────────────────── */

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        ...style,
      }}
    />
  )
}

/* ─── Skeleton Card ─────────────────────────────────────────────────────── */

export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

/* ─── Skeleton Table Row ────────────────────────────────────────────────── */

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-3 w-8" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

/* ─── Skeleton Dashboard ────────────────────────────────────────────────── */

export function SkeletonDashboard() {
  return (
    <div className="p-8 space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Skeleton className="h-8 w-8 mb-3" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

/* ─── Skeleton Editor ───────────────────────────────────────────────────── */

export function SkeletonEditor() {
  return (
    <div className="h-screen flex" style={{ backgroundColor: '#050816' }}>
      <div className="w-60 border-r p-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-2/3" />
      </div>
    </div>
  )
}
