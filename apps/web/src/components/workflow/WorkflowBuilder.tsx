'use client'

import { useState, useEffect } from 'react'

interface WorkflowStep {
  id: string
  type: 'ai_generate' | 'export' | 'notify' | 'transform' | 'publish' | 'webhook'
  config: Record<string, any>
  order: number
}

interface Workflow {
  id: string
  name: string
  description: string | null
  trigger: string
  steps: WorkflowStep[]
  enabled: boolean
  lastRun: string | null
  createdAt: string
  updatedAt: string
}

const STEP_TYPES = [
  { id: 'ai_generate', label: 'AI Generate', icon: '✨', color: 'violet' },
  { id: 'export', label: 'Export', icon: '📦', color: 'emerald' },
  { id: 'notify', label: 'Notify', icon: '🔔', color: 'amber' },
  { id: 'transform', label: 'Transform', icon: '🔄', color: 'blue' },
  { id: 'publish', label: 'Publish', icon: '🚀', color: 'rose' },
  { id: 'webhook', label: 'Webhook', icon: '🔗', color: 'cyan' },
]

const TRIGGERS = [
  { id: 'manual', label: 'Manual' },
  { id: 'on_create', label: 'On Create' },
  { id: 'on_save', label: 'On Save' },
  { id: 'on_publish', label: 'On Publish' },
  { id: 'on_schedule', label: 'Scheduled' },
]

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [executingId, setExecutingId] = useState<string | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workflows')
      const data = await res.json()
      if (data.success) {
        setWorkflows(data.data ?? data.workflows ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    setExecutingId(workflowId)
    try {
      await fetch(`/api/workflows/${workflowId}/execute`, { method: 'POST' })
      loadWorkflows()
    } catch {
      // silent
    } finally {
      setExecutingId(null)
    }
  }

  const toggleEnabled = async (workflow: Workflow) => {
    try {
      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !workflow.enabled }),
      })
      loadWorkflows()
    } catch {
      // silent
    }
  }

  const deleteWorkflow = async (workflowId: string) => {
    if (!window.confirm('Delete this workflow?')) return
    try {
      await fetch(`/api/workflows/${workflowId}`, { method: 'DELETE' })
      loadWorkflows()
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all"
        >
          New Workflow
        </button>
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No workflows yet</p>
          <p className="text-xs text-gray-600 mt-1">Automate your workflow with triggers and actions</p>
        </div>
      )}

      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="rounded-xl border border-white/10 p-4 hover:bg-white/[0.02] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleEnabled(workflow)}
                  className={`w-8 h-5 rounded-full transition-colors relative ${
                    workflow.enabled ? 'bg-violet-600' : 'bg-white/10'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    workflow.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`} />
                </button>
                <div>
                  <h3 className="text-sm font-semibold text-white">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-[10px] text-gray-500">{workflow.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {workflow.trigger !== 'manual' && (
                  <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                    {TRIGGERS.find(t => t.id === workflow.trigger)?.label || workflow.trigger}
                  </span>
                )}
                <button
                  onClick={() => executeWorkflow(workflow.id)}
                  disabled={executingId === workflow.id || !workflow.enabled}
                  className="px-3 py-1 rounded-lg text-[10px] font-medium text-violet-400 hover:text-white hover:bg-violet-500/20 border border-violet-500/30 transition-all disabled:opacity-50"
                >
                  {executingId === workflow.id ? 'Running...' : 'Run'}
                </button>
                <button onClick={() => deleteWorkflow(workflow.id)}
                  className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Steps visualization */}
            <div className="flex items-center gap-2 flex-wrap">
              {(workflow.steps as any[])?.sort((a, b) => a.order - b.order).map((step, i, arr) => {
                const stepType = STEP_TYPES.find(s => s.id === step.type)
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs">
                      <span>{stepType?.icon || '⚡'}</span>
                      <span className="text-gray-400">{stepType?.label || step.type}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>

            {workflow.lastRun && (
              <p className="text-[10px] text-gray-600 mt-2">
                Last run: {new Date(workflow.lastRun).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateWorkflowModal onClose={() => setShowCreate(false)} onCreated={loadWorkflows} />
      )}
    </div>
  )
}

function CreateWorkflowModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [trigger, setTrigger] = useState('manual')
  const [steps, setSteps] = useState<WorkflowStep[]>([{
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    type: 'notify',
    config: {},
    order: 0,
  }])

  const addStep = () => {
    setSteps(prev => [...prev, {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      type: 'notify',
      config: {},
      order: prev.length,
    }])
  }

  const updateStep = (index: number, type: WorkflowStep['type']) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, type } : s))
  }

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })))
  }

  const handleCreate = async () => {
    if (!name || steps.length === 0) return
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, trigger, steps }),
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
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6"
        style={{ backgroundColor: '#0d0d1a', borderColor: 'rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-1">New Workflow</h3>
        <p className="text-xs text-gray-500 mb-4">Create an automated workflow</p>

        <div className="space-y-3 mb-4">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Workflow name"
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50"
          />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-violet-500/50 resize-none"
          />
          <div>
            <label className="text-xs text-gray-400 block mb-1">Trigger</label>
            <select value={trigger} onChange={(e) => setTrigger(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 outline-none"
            >
              {TRIGGERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Steps */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Steps</label>
            <button onClick={addStep} className="text-[10px] text-violet-400 hover:text-violet-300">+ Add step</button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <span className="text-[10px] text-gray-600 w-4">{i + 1}.</span>
                <select value={step.type} onChange={(e) => updateStep(i, e.target.value as any)}
                  className="flex-1 bg-transparent text-xs text-white outline-none"
                >
                  {STEP_TYPES.map(st => <option key={st.id} value={st.id}>{st.icon} {st.label}</option>)}
                </select>
                <button onClick={() => removeStep(i)} className="text-[10px] text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white">Cancel</button>
          <button onClick={handleCreate} disabled={!name || steps.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
          >
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  )
}
