'use client'

import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder'

export default function WorkflowsPage() {
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
              { label: 'Workflows' },
            ]} />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">Automate your content creation pipeline</p>
        </div>
        <WorkflowBuilder />
      </div>
    </div>
  )
}
