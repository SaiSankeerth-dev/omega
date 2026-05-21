'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useEditorStore } from '@/store/editor'
import { useAIStore } from '@/store/ai'
import { CollaborationBar } from '@/components/ui/CollaborationUI'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SkeletonEditor } from '@/components/ui/Skeleton'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { VersionHistory } from '@/components/editor/VersionHistory'
import { AutosaveIndicator, useAutosave } from '@/components/editor/AutosaveIndicator'
import { PresenceCursors } from '@/components/editor/PresenceCursors'
import { ExportDialog } from '@/components/export/ExportDialog'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Panel = 'design' | 'animate' | 'export' | 'versions'
type BlockType = 'heading' | 'text' | 'image' | 'divider' | 'quote'

interface CanvasBlock {
  id: string
  type: BlockType
  content: string
}

interface DocumentContent {
  blocks: CanvasBlock[]
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const AI_TOOLS = [
  { icon: '✨', label: 'Generate', action: 'generate' },
  { icon: '🖼️', label: 'Image', action: 'image' },
  { icon: 'Aa', label: 'Type', action: 'type' },
  { icon: '🔲', label: 'Layout', action: 'layout' },
]

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'image', label: 'Image', icon: '🖼️' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'quote', label: 'Quote', icon: '"' },
]

/* ─── Helpers ───────────────────────────────────────────────────────────── */

let blockCounter = 0
const generateId = () => `block-${++blockCounter}-${Date.now()}`

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string

  const editor = useEditorStore()
  const ai = useAIStore()

  const [blocks, setBlocks] = useState<CanvasBlock[]>(() => {
    // Try to restore from editor store
    if (editor.content?.blocks) {
      return (editor.content as unknown as DocumentContent).blocks
    }
    return [
      { id: generateId(), type: 'heading', content: 'Build something extraordinary' },
      { id: generateId(), type: 'text', content: 'Production-grade AI content infrastructure. Create stunning presentations, websites, documents, and visual stories — powered by AI, crafted by you.' },
      { id: generateId(), type: 'image', content: '' },
      { id: generateId(), type: 'quote', content: 'The best way to predict the future is to create it.' },
    ]
  })
  const [activePanel, setActivePanel] = useState<Panel>('design')
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dragBlockId, setDragBlockId] = useState<string | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [projectName, setProjectName] = useState('Untitled Project')

  // ── Rich text mode toggle ────────────────────────────────────────────
  const [richTextMode, setRichTextMode] = useState(false)
  const [tiptapContent, setTipTapContent] = useState<any>(null)
  const tiptapRef = useRef<any>(null)

  // ── Autosave hook ────────────────────────────────────────────────────
  const contentForSave = useCallback(() => {
    return { blocks, richText: tiptapContent }
  }, [blocks, tiptapContent])

  const { status: saveStatus, markDirty, saveNow } = useAutosave({
    projectId,
    getContent: contentForSave,
    delay: 2000,
  })

  // ── Sync blocks to editor store ──────────────────────────────────────
  useEffect(() => {
    editor.setContent({ blocks })
    editor.setCurrentProject(projectId)
  }, [blocks, projectId])

  // ── Loading state ────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <SkeletonEditor />

  // ── Block CRUD ───────────────────────────────────────────────────────

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock: CanvasBlock = {
      id: generateId(),
      type,
      content: type === 'heading' ? 'New heading' : type === 'quote' ? 'New quote' : '',
    }
    setBlocks((prev) => {
      if (afterId) {
        const idx = prev.findIndex((b) => b.id === afterId)
        if (idx >= 0) {
          const next = [...prev]
          next.splice(idx + 1, 0, newBlock)
          return next
        }
      }
      return [...prev, newBlock]
    })
    markDirty()
    setSelectedBlockId(newBlock.id)
    setEditingBlockId(newBlock.id)
    setEditContent(newBlock.content)
  }, [markDirty])

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    markDirty()
    if (selectedBlockId === id) setSelectedBlockId(null)
    if (editingBlockId === id) setEditingBlockId(null)
  }, [selectedBlockId, editingBlockId, markDirty])

  const updateBlockContent = useCallback((id: string, content: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)))
    markDirty()
  }, [markDirty])

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= next.length) return prev
      const temp = next[idx]!
      next[idx] = next[targetIdx]!
      next[targetIdx] = temp
      return next
    })
    markDirty()
  }, [markDirty])

  // ── Drag and drop ────────────────────────────────────────────────────
  const handleDragStart = useCallback((id: string) => {
    setDragBlockId(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOverId(id)
  }, [])

  const handleDrop = useCallback((targetId: string) => {
    if (!dragBlockId || dragBlockId === targetId) {
      setDragBlockId(null)
      setDragOverId(null)
      return
    }
    setBlocks((prev) => {
      const fromIdx = prev.findIndex((b) => b.id === dragBlockId)
      const toIdx = prev.findIndex((b) => b.id === targetId)
      if (fromIdx < 0 || toIdx < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved!)
      return next
    })
    markDirty()
    setDragBlockId(null)
    setDragOverId(null)
  }, [dragBlockId, markDirty])

  // ── AI Generation ─────────────────────────────────────────────────────
  const handleAIGenerate = useCallback(() => {
    if (!aiPrompt.trim()) return

    ai.addMessage({
      id: generateId(),
      role: 'user',
      content: aiPrompt,
      timestamp: new Date(),
    })
    ai.setProcessing(true)

    setTimeout(() => {
      const newBlocks = aiPrompt.toLowerCase().includes('presentation')
        ? [
            { id: generateId(), type: 'heading' as const, content: aiPrompt },
            { id: generateId(), type: 'text' as const, content: 'Generated content based on your prompt.' },
            { id: generateId(), type: 'image' as const, content: '' },
            { id: generateId(), type: 'quote' as const, content: 'AI-generated presentations, powered by Omega.' },
          ]
        : [
            { id: generateId(), type: 'heading' as const, content: aiPrompt },
            { id: generateId(), type: 'text' as const, content: 'This content was generated by AI based on your input.' },
          ]

      setBlocks(newBlocks)
      markDirty()
      ai.addMessage({
        id: generateId(),
        role: 'assistant',
        content: `Generated ${newBlocks.length} slides based on your prompt.`,
        timestamp: new Date(),
      })
      ai.setProcessing(false)
      setAiPrompt('')
      setShowAIModal(false)
    }, 1500)
  }, [aiPrompt, ai, markDirty])

  // ── Quick AI suggestions ──────────────────────────────────────────────
  const aiSuggestions = [
    { label: 'Rewrite this', action: () => setAiPrompt('Rewrite this slide with a more professional tone') },
    { label: 'Make it shorter', action: () => setAiPrompt('Make this slide shorter and more concise') },
    { label: 'Add a section', action: () => setAiPrompt('Add a new section about') },
    { label: 'Change theme', action: () => setAiPrompt('Change the theme to a dark modern style') },
  ]

  // ── Start inline editing ──────────────────────────────────────────────
  const startEditing = useCallback((block: CanvasBlock) => {
    setEditingBlockId(block.id)
    setEditContent(block.content)
  }, [])

  const finishEditing = useCallback((blockId: string) => {
    if (editingBlockId === blockId) {
      updateBlockContent(blockId, editContent)
      setEditingBlockId(null)
    }
  }, [editingBlockId, editContent, updateBlockContent])

  return (
    <div className="h-screen bg-[#050816] flex flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between h-14 px-4 border-b shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <Breadcrumb items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: projectName },
          ]} />
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-sm font-medium text-white bg-transparent border-none outline-none focus:ring-1 focus:ring-violet-500/30 rounded px-2 py-1"
          />
          <AutosaveIndicator status={saveStatus} />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <CollaborationBar projectId={projectId} />

          <button onClick={saveNow}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save'}
          </button>

          <button onClick={() => router.push(`/present/${projectId}`)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            title="Present"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="sm:hidden"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            <span className="hidden sm:inline">Present</span>
          </button>

          <button onClick={() => setShowExportDialog(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Export
          </button>

          {/* Rich text mode toggle */}
          <button onClick={() => setRichTextMode(!richTextMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${richTextMode ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            title={richTextMode ? 'Switch to block editor' : 'Switch to rich text editor'}
          >
            {richTextMode ? '📝 Blocks' : '🔤 Rich Text'}
          </button>

          <button
            className="px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
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
          {/* Block types to add */}
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Add Blocks</h3>
            <div className="space-y-0.5">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type, selectedBlockId ?? undefined)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="text-sm w-5 text-center">{bt.icon}</span>
                  {bt.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tools */}
          <div className="p-3">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">AI Tools</h3>
            <div className="space-y-0.5">
              {AI_TOOLS.map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => { setShowAIModal(true); setAiPrompt('') }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  <span className="text-sm">{tool.icon}</span>
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blocks list */}
          <div className="flex-1 overflow-y-auto p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
              Blocks ({blocks.length})
            </h3>
            <div className="space-y-0.5">
              {blocks.map((block, i) => (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all ${
                    selectedBlockId === block.id
                      ? 'text-white bg-violet-500/10'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs opacity-60 w-4">{i + 1}</span>
                  <span className="truncate">
                    {block.type === 'heading' ? '🔤' : block.type === 'text' ? '¶' : block.type === 'image' ? '🖼️' : block.type === 'quote' ? '"' : '—'}{' '}
                    {block.content || block.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Center: Canvas ──────────────────────────────────────────────── */}
        <main className="flex-1 flex items-start justify-center overflow-auto bg-[#0a0a1a] py-8"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Rich text mode */}
          {richTextMode ? (
            <div className="w-full max-w-3xl mx-auto px-8">
              <TipTapEditor
                content={tiptapContent}
                onChange={(content) => {
                  setTipTapContent(content)
                  markDirty()
                }}
                projectId={projectId}
                onEditorReady={(editor) => { tiptapRef.current = editor }}
                placeholder="Start writing..."
              />
            </div>
          ) : (
          <div ref={canvasRef} className="w-full max-w-3xl mx-auto px-8 space-y-4">
            {blocks.map((block, i) => (
              <div
                key={block.id}
                data-block-id={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDrop={() => handleDrop(block.id)}
                onDragEnd={() => { setDragBlockId(null); setDragOverId(null) }}
                onClick={() => setSelectedBlockId(block.id)}
                className={`group relative rounded-xl transition-all ${
                  selectedBlockId === block.id ? 'ring-1 ring-violet-500/40' : ''
                } ${dragOverId === block.id ? 'ring-2 ring-violet-500/60' : ''} cursor-pointer`}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${
                    selectedBlockId === block.id
                      ? 'rgba(139,92,246,0.3)'
                      : dragOverId === block.id
                      ? 'rgba(139,92,246,0.4)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                }}
              >
                {/* Block toolbar */}
                <div
                  className={`absolute -top-3 right-2 flex items-center gap-1 transition-opacity ${
                    selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                    disabled={i === 0}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                    title="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                    disabled={i === blocks.length - 1}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                    title="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); addBlock('text', block.id) }}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Add block after"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    title="Delete block"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Render block by type */}
                {block.type === 'heading' && (
                  editingBlockId === block.id ? (
                    <input
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={() => finishEditing(block.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') finishEditing(block.id) }}
                      className="w-full p-6 text-3xl font-bold text-white bg-transparent outline-none"
                    />
                  ) : (
                    <h2
                      className="p-6 text-3xl font-bold text-white cursor-text"
                      onClick={() => startEditing(block)}
                    >
                      {block.content || 'Click to edit heading'}
                    </h2>
                  )
                )}

                {block.type === 'text' && (
                  editingBlockId === block.id ? (
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={() => finishEditing(block.id)}
                      className="w-full p-6 text-sm text-gray-300 bg-transparent outline-none resize-none leading-relaxed"
                      rows={4}
                    />
                  ) : (
                    <p
                      className="p-6 text-sm text-gray-300 leading-relaxed cursor-text"
                      onClick={() => startEditing(block)}
                    >
                      {block.content || 'Click to edit text'}
                    </p>
                  )
                )}

                {block.type === 'image' && (
                  <div
                    className="p-6 flex items-center justify-center cursor-pointer"
                    style={{ minHeight: '200px' }}
                    onClick={() => startEditing(block)}
                  >
                    <div className="text-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-xs text-gray-600">
                        {block.content || 'Click to add image URL'}
                      </p>
                    </div>
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="py-4 px-6">
                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}

                {block.type === 'quote' && (
                  editingBlockId === block.id ? (
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onBlur={() => finishEditing(block.id)}
                      className="w-full p-6 text-base italic text-violet-300 bg-transparent outline-none resize-none leading-relaxed"
                      rows={3}
                    />
                  ) : (
                    <blockquote
                      className="p-6 text-base italic text-violet-300 border-l-2 border-violet-500/50 ml-4 cursor-text"
                      onClick={() => startEditing(block)}
                    >
                      {block.content || 'Click to edit quote'}
                    </blockquote>
                  )
                )}
              </div>
            ))}

            {/* Add block button at bottom */}
            <div className="flex items-center justify-center py-4">
              <button
                onClick={() => addBlock('text')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-dashed border-white/10 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                Add block
              </button>
            </div>
          </div>
          )}
        </main>

        {/* ── Right panel: Properties ────────────────────────────────────── */}
        <aside
          className="w-72 shrink-0 flex flex-col border-l"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {/* Panel tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {(['design', 'animate', 'export', 'versions'] as Panel[]).map((panel) => (
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
                <Section title="Export">
                  <button onClick={() => setShowExportDialog(true)}
                    className="w-full px-3 py-2.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all"
                  >
                    Open Export Dialog
                  </button>
                  <p className="text-[10px] text-gray-600 text-center mt-2">
                    PPTX, PDF, HTML, and JSON formats
                  </p>
                </Section>
              </div>
            )}

            {activePanel === 'versions' && (
              <div>
                <VersionHistory projectId={projectId} />
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
        aria-label="AI Assist"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.2L21 12l-6.6 2.8L12 22l-2.4-7.2L3 12l6.6-2.8z" />
        </svg>
      </button>

      {/* ── Export Dialog ──────────────────────────────────────────────── */}
      {showExportDialog && (
        <ExportDialog
          projectId={projectId}
          projectName={projectName}
          content={{ blocks }}
          onClose={() => setShowExportDialog(false)}
        />
      )}

      {/* ── Collaboration Cursors ──────────────────────────────────────── */}
      <PresenceCursors
        projectId={projectId}
        currentUserId={projectId}
      />

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
              {aiSuggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={s.action}
                  className="px-3 py-1.5 rounded-full text-xs text-gray-400 hover:text-white border border-white/10 hover:border-violet-500/30 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* AI conversation messages */}
            {ai.messages.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto space-y-2 border-t border-white/5 pt-3">
                {ai.messages.map((msg: { id: string; role: string; content: string }) => (
                  <div key={msg.id} className={`text-xs ${msg.role === 'user' ? 'text-violet-300' : 'text-gray-400'}`}>
                    <span className="font-semibold">{msg.role === 'user' ? 'You' : 'Omega'}:</span>{' '}
                    {msg.content}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || ai.isProcessing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                {ai.isProcessing ? 'Generating...' : 'Generate'}
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

/* ─── HTML Export Generator ─────────────────────────────────────────────── */

function generateHTMLExport(blocks: CanvasBlock[], title: string): string {
  const renderBlock = (block: CanvasBlock): string => {
    switch (block.type) {
      case 'heading':
        return `<h1 style="font-size:2rem;font-weight:700;color:#fff;margin:1rem 0;">${block.content || 'Heading'}</h1>`
      case 'text':
        return `<p style="font-size:0.9rem;color:#d1d5db;line-height:1.7;margin:1rem 0;">${block.content || 'Text'}</p>`
      case 'image':
        return `<div style="background:rgba(255,255,255,0.05);border:1px dashed rgba(255,255,255,0.15);border-radius:8px;height:200px;display:flex;align-items:center;justify-content:center;margin:1rem 0;color:#6b7280;font-size:0.8rem;">Image Placeholder</div>`
      case 'divider':
        return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1rem 0;" />`
      case 'quote':
        return `<blockquote style="border-left:3px solid #8b5cf6;padding:0.5rem 1rem;margin:1rem 0;color:#a78bfa;font-style:italic;font-size:1rem;">${block.content || 'Quote'}</blockquote>`
      default:
        return ''
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #050816;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      padding: 2rem;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1, h2, h3 { color: #fff; }
    p { color: #d1d5db; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="font-size:1.5rem;font-weight:600;margin-bottom:2rem;color:#8b5cf6;">${title}</h1>
    ${blocks.map(renderBlock).join('\n    ')}
  </div>
</body>
</html>`
}
