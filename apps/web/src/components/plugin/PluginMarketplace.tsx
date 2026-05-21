'use client'

import { useState, useEffect } from 'react'

interface Plugin {
  id: string
  name: string
  description: string | null
  version: string
  author: string
  authorId: string
  icon: string | null
  category: string
  downloads: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export function PluginMarketplace() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadPlugins()
  }, [category])

  const loadPlugins = async () => {
    setLoading(true)
    try {
      const url = `/api/plugins${category ? `?category=${category}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setPlugins(data.data ?? data.plugins ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const installPlugin = async (pluginId: string) => {
    try {
      await fetch(`/api/plugins/${pluginId}/install`, { method: 'POST' })
      loadPlugins()
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !category ? 'text-white bg-violet-500/20 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 border border-white/10'
          }`}
        >
          All
        </button>
        {['Design', 'AI', 'Export', 'Analytics', 'Media', 'Charts'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              category === cat ? 'text-white bg-violet-500/20 border border-violet-500/30' : 'text-gray-500 hover:text-gray-300 border border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all"
        >
          Submit Plugin
        </button>
      </div>

      {plugins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No plugins found</p>
          <p className="text-xs text-gray-600 mt-1">Plugins extend Omega with new capabilities</p>
        </div>
      )}

      {/* Plugin grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="rounded-xl border border-white/10 p-4 hover:bg-white/[0.02] transition-all group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-lg shrink-0">
                {plugin.icon || '🧩'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{plugin.name}</h3>
                <p className="text-[10px] text-gray-500">v{plugin.version} · {plugin.category}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 mb-3 min-h-[2rem]">
              {plugin.description || 'No description'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">                  <span className="text-[10px] text-gray-600">by {plugin.author}</span>
                <span className="text-[10px] text-gray-600">{plugin.downloads} downloads</span>
              </div>
              <button
                onClick={() => installPlugin(plugin.id)}
                className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-lg text-[10px] font-medium text-violet-400 hover:text-white hover:bg-violet-500/20 border border-violet-500/30 transition-all"
              >
                Install
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreatePluginModal onClose={() => setShowCreate(false)} onCreated={loadPlugins} />
      )}
    </div>
  )
}

function CreatePluginModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Other')

  const handleCreate = async () => {
    if (!name) return
    try {
      await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, category }),
      })
      onCreated()
      onClose()
    } catch {
      // silent
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6"
        style={{ backgroundColor: '#0d0d1a', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-1">Submit Plugin</h3>
        <p className="text-xs text-gray-500 mb-4">Share your plugin with the Omega community</p>
        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plugin name"
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50"
          />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50 resize-none"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none"
          >
            <option value="Design">Design</option>
            <option value="AI">AI</option>
            <option value="Export">Export</option>
            <option value="Analytics">Analytics</option>
            <option value="Media">Media</option>
            <option value="Charts">Charts</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex gap-2 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white">Cancel</button>
          <button onClick={handleCreate} disabled={!name}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
          >
            Submit Plugin
          </button>
        </div>
      </div>
    </div>
  )
}
