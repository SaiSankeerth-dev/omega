'use client'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { DashboardAnalytics } from '@/components/analytics/DashboardAnalytics'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050816' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(5,8,22,0.8)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Breadcrumb items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Analytics' },
            ]} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your platform usage and engagement</p>
        </div>
        <DashboardAnalytics />
      </div>
    </div>
  )
}
