'use client'

import { useState } from 'react'

interface ExportDialogProps {
  projectId: string
  projectName: string
  onClose: () => void
  content?: any
}

export function ExportDialog({ projectId, projectName, onClose, content }: ExportDialogProps) {
  const [format, setFormat] = useState<string>('pptx')
  const [exporting, setExporting] = useState(false)
  const [includeImages, setIncludeImages] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)

    try {
      if (format === 'pptx') {
        // Use pptxgenjs client-side for real PPTX generation
        const pptxgen = (await import('pptxgenjs')).default
        const pptx = new pptxgen()

        pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
        pptx.layout = 'WIDE'

        pptx.theme = {
          // @ts-ignore
          color: [
            { name: 'bg1', color: '0A0A1A' },
            { name: 'accent1', color: '8B5CF6' },
            { name: 'text1', color: 'F8FAFC' },
          ],
        }

        const slide1 = pptx.addSlide()
        slide1.background = { fill: '0A0A1A' }
        slide1.addText(projectName, {
          x: 1, y: 2, w: 11.33, h: 1.5,
          fontSize: 44,
          color: 'F8FAFC',
          fontFace: 'Inter',
          bold: true,
          align: 'center',
        })
        slide1.addText('Powered by Omega', {
          x: 1, y: 3.5, w: 11.33, h: 0.8,
          fontSize: 18,
          color: '8B5CF6',
          fontFace: 'Inter',
          align: 'center',
        })

        if (content?.blocks) {
          content.blocks.forEach((block: any, i: number) => {
            if (i === 0) return // Skip first block (already on slide1)
            const slide = pptx.addSlide()
            slide.background = { fill: '0A0A1A' }

            if (block.type === 'heading') {
              slide.addText(block.content, {
                x: 1, y: 2, w: 11.33, h: 1,
                fontSize: 32,
                color: 'F8FAFC',
                fontFace: 'Inter',
                bold: true,
              })
            } else if (block.type === 'text') {
              slide.addText(block.content, {
                x: 1, y: 2, w: 11.33, h: 2,
                fontSize: 18,
                color: 'CBD5E1',
                fontFace: 'Inter',
                lineSpacing: 28,
              })
            } else if (block.type === 'quote') {
              slide.addText(block.content, {
                x: 1.5, y: 2, w: 10.33, h: 2,
                fontSize: 22,
                color: 'A78BFA',
                fontFace: 'Inter',
                italic: true,
              })
            }
          })
        }

        await pptx.writeFile({ fileName: `${projectName.replace(/\s+/g, '-').toLowerCase()}.pptx` })
      } else if (format === 'pdf' && content?.blocks) {
        const { default: html2canvas } = await import('html2canvas')
        const { default: jsPDF } = await import('jspdf')
        const pdf = new jsPDF('p', 'mm', 'a4')

        for (let i = 0; i < content.blocks.length; i++) {
          const block = content.blocks[i]
          const tempDiv = document.createElement('div')
          tempDiv.style.cssText = 'background:#0A0A1A;color:#F8FAFC;padding:40px;font-family:Inter,sans-serif;width:800px;'
          tempDiv.innerHTML = renderBlockHTML(block)
          document.body.appendChild(tempDiv)

          const canvas = await html2canvas(tempDiv, {
            backgroundColor: '#0A0A1A',
            scale: 2,
          })
          document.body.removeChild(tempDiv)

          const imgData = canvas.toDataURL('image/png')
          if (i > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, 10, 190, 0)
        }
        pdf.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}.pdf`)
      } else {
        // Server-side export for JSON and HTML
        const res = await fetch(`/api/export/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format,
            options: { includeImages, includeNotes },
          }),
        })
        const data = await res.json()
        if (!data.success) {
          setError(data.error || 'Export failed')
          setExporting(false)
          return
        }

        if (format === 'html') {
          const blob = new Blob([data.data], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.html`
          a.click()
          URL.revokeObjectURL(url)
        } else if (format === 'json') {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.json`
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-6"
        style={{
          backgroundColor: '#0d0d1a',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-1">Export Project</h3>
        <p className="text-xs text-gray-500 mb-5">Choose format and options for export</p>

        {/* Format selection */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { id: 'pptx', label: 'PPTX', desc: 'PowerPoint' },
            { id: 'pdf', label: 'PDF', desc: 'Document' },
            { id: 'html', label: 'HTML', desc: 'Web page' },
            { id: 'json', label: 'JSON', desc: 'Raw data' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFormat(opt.id)}
              className={`p-3 rounded-xl text-left transition-all border ${
                format === opt.id
                  ? 'border-violet-500/50 bg-violet-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <p className="text-sm font-semibold text-white">{opt.label}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-500"
            />
            <span className="text-xs text-gray-400">Include images</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-500"
            />
            <span className="text-xs text-gray-400">Include presenter notes</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-all">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-all disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function renderBlockHTML(block: any): string {
  switch (block.type) {
    case 'heading':
      return `<h1 style="font-size:2.5rem;font-weight:700;color:#f8fafc;margin-bottom:1rem;">${block.content || ''}</h1>`
    case 'text':
      return `<p style="font-size:1.1rem;color:#cbd5e1;line-height:1.8;">${block.content || ''}</p>`
    case 'quote':
      return `<blockquote style="border-left:4px solid #8b5cf6;padding:0.75rem 1.25rem;margin:1rem 0;color:#a78bfa;font-style:italic;font-size:1.2rem;">${block.content || ''}</blockquote>`
    default:
      return ''
  }
}
