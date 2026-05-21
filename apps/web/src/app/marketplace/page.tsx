'use client'

import { useState } from 'react'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PluginMarketplace } from '@/components/plugin/PluginMarketplace'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

type Tab = 'plugins' | 'templates'

export default function MarketplacePage() {
  const [tab, setTab] = useState<Tab>('plugins')

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
              { label: 'Marketplace' },
            ]} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => setTab('plugins')}
            className={`text-sm font-medium transition-all pb-2 border-b-2 ${
              tab === 'plugins'
                ? 'text-violet-400 border-violet-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            🧩 Plugins
          </button>
          <button
            onClick={() => setTab('templates')}
            className={`text-sm font-medium transition-all pb-2 border-b-2 ${
              tab === 'templates'
                ? 'text-violet-400 border-violet-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            📋 Templates
          </button>
        </div>

        {tab === 'plugins' ? (
          <PluginMarketplace />
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">Template marketplace coming soon</p>
            <p className="text-xs text-gray-600 mt-1">Create and share templates with the community</p>
          </div>
        )}
      </div>
    </div>
  )
}
