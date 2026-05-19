'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Panel = 'design' | 'animate' | 'export'

interface CanvasBlock {
  id: string
  type: 'heading' | 'text' | 'image' | 'ai'
  content: string
}

/* ─── Mock data ─────────────────────────────────────────────────────────── */

const AI_TOOLS = [
  { icon: '✨', label: 'Generate' },
  { icon: '🖼️', label: 'Image' },
  { icon: 'Aa', label: 'Type' },
  { icon: '🔲', label: 'Layout' },
]

const MOCK_BLOCKS: CanvasBlock[] = [
  { id: '1', type: 'heading', content: 'Build something extraordinary' },
  { id: '2', type: 'text', content: 'Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories — powered by AI, crafted by you.' },
  { id: '3', type: 'image', content: '' },
  { id: '4', type: 'ai', content: '' },
]

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function EditorPage() {
  const params = useParams()
  void params?.projectId
  const [blocks] = useState<CanvasBlock[]>(MOCK_BLOCKS)
  const [activePanel, setActivePanel] = useState<Panel>('design')
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  return (
    <div className="h-screen bg-[#050816] flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between h-14 px-4 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </a>
          <span className="text-sm font-medium text-white">Untitled Project</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            Save
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            Export
          </button>
          <button
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            Publish
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: Pages + AI Tools ──────────────────────────────── */}
        <aside
          className="w-60 shrink-0 flex flex-col border-r"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Pages list */}
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Pages</h3>
            <div className="space-y-0.5">
              {['Slide 1', 'Slide 2', 'Slide 3'].map((page) => (
                <button
                  key={page}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  {page}
                </button>
              ))}
            </div>
            <button className="mt-2 w-full text-left px-2 py-1.5 rounded-lg text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all">
              + Add page
            </button>
          </div>

          {/* AI Tools */}
          <div className="p-3">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">AI Tools</h3>
            <div className="space-y-0.5">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.label}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="text-sm">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center: Canvas ──────────────────────────────────────────────── */}
        <main className="flex-1 flex items-center justify-center overflow-auto bg-[#0a0a1a]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="w-full max-w-3xl mx-auto p-8 space-y-4">
            {blocks.map((block) => (
              <CanvasBlockRenderer key={block.id} block={block} />
            ))}
          </div>
        </main>

        {/* ── Right panel: Properties ────────────────────────────────────── */}
        <aside
          className="w-72 shrink-0 flex flex-col border-l"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Panel tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {(['design', 'animate', 'export'] as Panel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                className={`flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-all ${
                  activePanel === panel
                    ? 'text-violet-400 border-b-2 border-violet-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {panel}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 p-4 space-y-5 overflow-auto">
            {activePanel === 'design' && (
              <>
                <Section title="Typography">
                  <ControlRow label="Font">
                    <select className="w-full bg-white/5 text-xs text-gray-300 rounded-lg px-2 py-1.5 border border-white/10">
                      <option>Inter</option>
                      <option>Geist</option>
                    </select>
                  </ControlRow>
                  <ControlRow label="Size">
                    <input type="range" min="12" max="72" defaultValue="24" className="w-full accent-violet-500" />
                  </ControlRow>
                </Section>

                <Section title="Colors">
                  <ControlRow label="Text">
                    <div className="w-6 h-6 rounded-full border border-white/10 cursor-pointer" style={{ backgroundColor: '#ffffff' }} />
                  </ControlRow>
                  <ControlRow label="Background">
                    <div className="w-6 h-6 rounded-full border border-white/10 cursor-pointer" style={{ backgroundColor: '#1a1a2e' }} />
                  </ControlRow>
                </Section>

                <Section title="Layout">
                  <ControlRow label="Width">
                    <input type="range" min="50" max="100" defaultValue="80" className="w-full accent-violet-500" />
                  </ControlRow>
                  <ControlRow label="Padding">
                    <input type="range" min="0" max="64" defaultValue="24" className="w-full accent-violet-500" />
                  </ControlRow>
                </Section>
              </>
            )}

            {activePanel === 'animate' && (
              <Section title="Transitions">
                <ControlRow label="Type">
                  <select className="w-full bg-white/5 text-xs text-gray-300 rounded-lg px-2 py-1.5 border border-white/10">
                    <option>Fade</option>
                    <option>Slide</option>
                    <option>Zoom</option>
                    <option>None</option>
                  </select>
                </ControlRow>
                <ControlRow label="Duration">
                  <input type="range" min="0.1" max="2" step="0.1" defaultValue="0.5" className="w-full accent-violet-500" />
                </ControlRow>
              </Section>
            )}

            {activePanel === 'export' && (
              <div className="space-y-3">
                {['PDF', 'PNG', 'PPTX', 'HTML'].map((fmt) => (
                  <button
                    key={fmt}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                  >
                    Export as {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── AI Assist Floating Button ────────────────────────────────────── */}
      <button
        onClick={() => setShowAIModal(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 z-40"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z" />
        </svg>
      </button>

      {/* ── AI Assist Modal ──────────────────────────────────────────────── */}
      {showAIModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowAIModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 border shadow-2xl"
            style={{
              backgroundColor: '#0d0d1a',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-2">AI Assist</h3>
            <p className="text-xs text-gray-500 mb-4">What would you like AI to do?</p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create or change..."
              rows={3}
              className="w-full bg-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none border border-white/10 focus:border-violet-500/50 transition-all resize-none"
            />

            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {['Rewrite this', 'Make it shorter', 'Add a section', 'Change theme'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => setAiPrompt(chip)}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-white border border-white/10 hover:border-violet-500/30 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 max-w-[140px]">{children}</div>
    </div>
  )
}

function CanvasBlockRenderer({ block }: { block: CanvasBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <div
          className="p-6 rounded-xl cursor-pointer transition-all hover:ring-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-3xl font-bold text-white">{block.content}</h2>
        </div>
      )
    case 'text':
      return (
        <div
          className="p-6 rounded-xl cursor-pointer transition-all hover:ring-1"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-sm text-gray-300 leading-relaxed">{block.content}</p>
        </div>
      )
    case 'image':
      return (
        <div
          className="p-6 rounded-xl cursor-pointer transition-all hover:ring-1 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', minHeight: '200px' }}
        >
          <div className="text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-xs text-gray-600">Click to add image</p>
          </div>
        </div>
      )
    case 'ai':
      return (
        <div
          className="p-6 rounded-xl"
          style={{ backgroundColor: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-violet-500/50 border-t-transparent animate-spin" />
            <span className="text-xs text-violet-400">AI generating...</span>
          </div>
        </div>
      )
  }
}
