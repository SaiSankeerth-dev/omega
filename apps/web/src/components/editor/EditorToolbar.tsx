'use client'

import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  const ToolBtn = ({ 
    onClick, 
    isActive, 
    children,
    title 
  }: { 
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title?: string
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded text-xs transition-all ${
        isActive 
          ? 'text-violet-400 bg-violet-500/20' 
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )

  const Divider = () => <span className="w-px h-5 bg-white/10 mx-0.5" />

  const addImage = () => {
    const url = window.prompt('Image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('Link URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-white/10 overflow-x-auto sticky top-0 z-10"
      style={{ backgroundColor: '#0d0d1a' }}
    >
      {/* Text style */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
        <span className="font-bold">B</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
        <span className="italic">I</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
        <span className="underline">U</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
        <span className="line-through">S</span>
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
        <span className="text-yellow-400">H</span>
      </ToolBtn>

      <Divider />

      {/* Heading */}
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
        H1
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
        H2
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
        H3
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align left">
        ≡
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Center">
        ≡
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align right">
        ≡
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
        •≡
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered list">
        1.
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task list">
        ☑
      </ToolBtn>

      <Divider />

      {/* Blocks */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
        ❝
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code block">
        {'</>'}
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        —
      </ToolBtn>

      <Divider />

      {/* Media */}
      <ToolBtn onClick={addImage} title="Image">
        🖼️
      </ToolBtn>
      <ToolBtn onClick={addLink} isActive={editor.isActive('link')} title="Link">
        🔗
      </ToolBtn>

      <Divider />

      {/* Undo/Redo */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
        ↩
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
        ↪
      </ToolBtn>
    </div>
  )
}
