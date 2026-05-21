'use client'

import { useState, useEffect } from 'react'

interface AnalyticsData {
  totalEvents: number
  uniqueUsers: number
  eventsByType: { event: string; count: number }[]
  eventsByDay: { date: string; count: number }[]
  topPages: { page: string; views: number }[]
}

export function DashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${days}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data?.dashboard ?? json.dashboard)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No analytics data available yet</p>
        <p className="text-xs text-gray-600 mt-1">Data will appear as you use the platform</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Events" value={data.totalEvents.toLocaleString()} icon="📊" />
        <StatCard title="Unique Users" value={data.uniqueUsers.toLocaleString()} icon="👤" />
        <StatCard title="Avg Events/User" value={data.uniqueUsers > 0 ? (data.totalEvents / data.uniqueUsers).toFixed(1) : '0'} icon="📈" />
      </div>

      {/* Events by type */}
      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Events by Type</h3>
        <div className="space-y-2">
          {data.eventsByType.slice(0, 10).map((event) => (
            <div key={event.event} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-32 truncate">{event.event}</span>
              <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all"
                  style={{
                    width: `${Math.min(100, (event.count / Math.max(...data.eventsByType.map(e => e.count))) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-16 text-right">{event.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Days selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Period:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              days === d ? 'text-white bg-violet-500/20 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Top pages */}
      {data.topPages.length > 0 && (
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Top Pages</h3>
          <div className="space-y-1">
            {data.topPages.map((page) => (
              <div key={page.page} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5">
                <span className="text-xs text-gray-400 truncate">{page.page}</span>
                <span className="text-xs text-gray-500">{page.views} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-4 hover:bg-white/[0.02] transition-all">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500">{title}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
