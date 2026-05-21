'use client';

import { useEffect, useRef, useState } from 'react';
import { useAIStore } from '@/store/ai';

interface Props {
  open: boolean;
  onClose: () => void;
  slideContext?: string; // JSON string of current slide, passed from editor
}

export function AIChatModal({ open, onClose, slideContext }: Props) {
  const { messages, isStreaming, streamingContent, sendMessage, clearChat } = useAIStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    await sendMessage(text, slideContext);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'var(--color-bg-surface, #1a1a2e)',
          border: '1px solid rgba(255,255,255,0.1)',
          height: '60vh',
          maxHeight: '600px',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>Ω</div>
            <span className="font-medium text-sm">Omega AI</span>
            {slideContext && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>slide context</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="text-xs opacity-50 hover:opacity-100 transition-opacity">clear</button>
            <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity text-lg leading-none">&times;</button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 opacity-40 text-sm">
              <div className="text-2xl mb-2">✦</div>
              Ask me to generate content, improve your slide, or create an outline.
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] rounded-xl px-3 py-2 text-sm"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                    : msg.error ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                  color: msg.error ? '#fca5a5' : 'inherit',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isStreaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.06)', whiteSpace: 'pre-wrap' }}>
                {streamingContent}
                <span className="inline-block w-1 h-3 ml-0.5 align-middle animate-pulse" style={{ background: '#7c3aed' }} />
              </div>
            </div>
          )}
          {isStreaming && !streamingContent && (
            <div className="flex justify-start">
              <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="animate-pulse opacity-60">thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send)"
              rows={1}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="rounded-xl px-3 py-2 text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', minWidth: '52px' }}
            >
              {isStreaming ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
