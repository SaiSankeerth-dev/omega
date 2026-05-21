# Omega Editor

The Omega editor is a block-based visual editor for creating presentations, websites, documents, and stories.

## Block Types

| Type | Description |
|------|-------------|
| `heading` | Large text heading (H2) |
| `text` | Paragraph text with multi-line support |
| `image` | Image placeholder with URL support |
| `divider` | Horizontal rule separator |
| `quote` | Styled blockquote with left accent border |

## Features

### Block Operations
- **Add**: Use the left panel or click "+ Add block" at the bottom
- **Edit**: Click any block to enter inline editing mode
- **Delete**: Hover over a block and click the X button
- **Reorder**: Drag blocks to reorder, or use the up/down arrows
- **Move**: Use keyboard-style up/down buttons on block hover

### Inline Editing
- Click any heading, text, or quote block to start editing
- Press Enter or click away to save
- Text blocks support multi-line content

### Export
Export your document to multiple formats:
- **PDF**: Full document exported as a multi-page PDF via `html2canvas` + `jsPDF`
- **PNG**: Single-page screenshot export
- **HTML**: Complete HTML document with embedded styles
- **PPTX**: JSON export (full PPTX support coming via PptxGenJS)

### AI Assist
- Click the floating AI button (bottom-right) to open the AI chat modal
- Describe what you want to create
- Use quick suggestion chips for common actions
- AI generates a new set of blocks based on your prompt
- Conversation history is tracked in the AI store

### Design Panel
- **Typography**: Font selection and size control
- **Colors**: Text and background color pickers
- **Layout**: Width and padding adjustment

### Animation Panel
- Transition type selection (Fade, Slide, Zoom, None)
- Duration control

## Store Integration

The editor uses two Zustand stores:

### Editor Store (`store/editor.ts`)
```typescript
interface EditorState {
  currentProjectId: string | null;
  content: Record<string, unknown> | null;
  isDirty: boolean;
  lastSaved: Date | null;
}
```

### AI Store (`store/ai.ts`)
```typescript
interface AIState {
  isProcessing: boolean;
  currentSessionId: string | null;
  messages: AIChatMessage[];
  error: string | null;
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `Escape` | Close modals / cancel editing |
| `Enter` | Confirm inline edit |
| Click | Select block |
| Drag | Reorder block |
