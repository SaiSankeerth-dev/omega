'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import { EditorToolbar } from './EditorToolbar'

interface TipTapEditorProps {
  content?: any
  onChange?: (content: any) => void
  editable?: boolean
  placeholder?: string
  projectId?: string
  onEditorReady?: (editor: any) => void
}

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Start typing...',
  projectId,
  onEditorReady,
}: TipTapEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: 'text-violet-400 hover:text-violet-300 underline cursor-pointer' },
      }),
      ImageExt.configure({
        inline: false,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = editor.getJSON()
        onChange(json)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-6 py-4',
      },
    },
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (editor && content && !editor.isDestroyed) {
      const currentContent = editor.getJSON()
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content)
      }
    }
  }, [editor, content])

  if (!isMounted || !editor) {
    return (
      <div className="min-h-[300px] rounded-xl border border-white/10 bg-white/[0.02] animate-pulse p-6">
        <div className="h-4 w-3/4 bg-white/10 rounded mb-3" />
        <div className="h-4 w-1/2 bg-white/10 rounded mb-3" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <EditorToolbar editor={editor} />
      <BubbleMenuInline editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .tiptap { outline: none; min-height: 300px; }
        .tiptap p { margin: 0.5rem 0; }
        .tiptap h1 { font-size: 1.875rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #f8fafc; }
        .tiptap h2 { font-size: 1.5rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #f1f5f9; }
        .tiptap h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #e2e8f0; }
        .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 0.5rem 0; }
        .tiptap li { margin: 0.25rem 0; }
        .tiptap blockquote { border-left: 3px solid #8b5cf6; padding: 0.5rem 1rem; margin: 1rem 0; color: #a78bfa; font-style: italic; }
        .tiptap pre { background: rgba(255,255,255,0.05); border-radius: 8px; padding: 1rem; margin: 1rem 0; overflow-x: auto; }
        .tiptap pre code { color: #e2e8f0; font-size: 0.875rem; }
        .tiptap img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
        .tiptap hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.5rem 0; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgba(255,255,255,0.2);
          pointer-events: none;
          height: 0;
        }
        .tiptap ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
        .tiptap ul[data-type="taskList"] li > label { flex-shrink: 0; }
        .tiptap ul[data-type="taskList"] li > label input[type="checkbox"] { accent-color: #8b5cf6; }
      `}</style>
    </div>
  )
}

// Inline BubbleMenu to avoid @tiptap/react v3 export issues
function BubbleMenuInline({ editor }: { editor: Editor | null }) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const { from, to, empty } = editor.state.selection
      if (empty || from === to) {
        setShow(false)
        return
      }

      const { view } = editor
      const coords = view.coordsAtPos(from)
      const editorRect = view.dom.getBoundingClientRect()

      setPosition({
        top: coords.top - editorRect.top - 40,
        left: coords.left - editorRect.left + (coords.right - coords.left) / 2,
      })
      setShow(true)
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('blur', () => setTimeout(() => setShow(false), 200))

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
      editor.off('blur', () => setTimeout(() => setShow(false), 200))
    }
  }, [editor])

  if (!show || !editor) return null

  return (
    <div
      ref={menuRef}
      className="absolute z-50 flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-2xl border border-white/10"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
        backgroundColor: '#1a1a2e',
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded text-xs font-bold transition-all ${editor.isActive('bold') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded text-xs italic transition-all ${editor.isActive('italic') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        I
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded text-xs underline transition-all ${editor.isActive('underline') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        U
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded text-xs line-through transition-all ${editor.isActive('strike') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        S
      </button>
      <span className="w-px h-4 bg-white/10 mx-1" />
      <button
        onClick={() => {
          const url = window.prompt('Link URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        className={`p-1.5 rounded text-xs transition-all ${editor.isActive('link') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        🔗
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded text-xs font-mono transition-all ${editor.isActive('code') ? 'text-violet-400 bg-violet-500/20' : 'text-gray-400 hover:text-white'}`}
      >
        {'</>'}
      </button>
    </div>
  )
}
