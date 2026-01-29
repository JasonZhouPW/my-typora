import { useState, useEffect, useRef, useCallback } from 'react'
import { useUIStore } from '../store'
import TableDialog from './TableDialog'

interface MarkdownToolbarProps {
  onInsertMarkdown: (text: { before: string; after: string } | string) => void
}

interface ToolbarButton {
  label: string
  action: () => string | { before: string; after: string }
  title: string
}

const BUTTONS: ToolbarButton[] = [
  { label: 'Bold', action: () => ({ before: '**', after: '**' }), title: 'Bold (Ctrl+B)' },
  { label: 'Italic', action: () => ({ before: '*', after: '*' }), title: 'Italic (Ctrl+I)' },
  { label: 'Strikethrough', action: () => ({ before: '~~', after: '~~' }), title: 'Strikethrough' },
  { label: 'H1', action: () => '# ', title: 'Heading 1' },
  { label: 'H2', action: () => '## ', title: 'Heading 2' },
  { label: 'H3', action: () => '### ', title: 'Heading 3' },
  { label: '•', action: () => '- ', title: 'Bullet list' },
  { label: '1.', action: () => '1. ', title: 'Numbered list' },
  { label: '[ ]', action: () => '- [ ] ', title: 'Checklist' },
  { label: '</>', action: () => ({ before: '```\n', after: '\n```' }), title: 'Code block' },
  { label: '`', action: () => ({ before: '`', after: '`' }), title: 'Inline code' },
  { label: '>', action: () => '> ', title: 'Blockquote' },
  { label: 'Link', action: () => ({ before: '[', after: '](url)' }), title: 'Link' },
  { label: 'Image', action: () => ({ before: '![', after: '](url)' }), title: 'Image' },
]

const baseButtonStyle = {
  padding: '6px 10px',
  fontSize: '13px',
  minWidth: '32px',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
}

const primaryButtonStyle = {
  padding: '6px 12px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '4px',
  backgroundColor: '#1976d2',
  color: 'white',
  cursor: 'pointer',
}

const baseTooltipStyle = {
  backgroundColor: '#333',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '13px',
  whiteSpace: 'nowrap' as const,
  zIndex: 2000,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
}

export default function MarkdownToolbar({ onInsertMarkdown }: MarkdownToolbarProps) {
  const { showSidebar, toggleSidebar, showPreview, togglePreview, showEditor, toggleEditor } = useUIStore()
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showLinkDialog && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [showLinkDialog])

  const handleShowLinkDialog = useCallback(() => {
    setShowLinkDialog(true)
  }, [])

  const handleInsertLink = useCallback(() => {
    if (linkText) {
      onInsertMarkdown(`[${linkText}](${linkText})`)
    }
    setShowLinkDialog(false)
    setLinkText('')
  }, [linkText, onInsertMarkdown])

  const handleCancelLink = useCallback(() => {
    setShowLinkDialog(false)
    setLinkText('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleInsertLink()
    if (e.key === 'Escape') handleCancelLink()
  }, [handleInsertLink, handleCancelLink])

  const handleButtonClick = useCallback((action: () => any) => {
    return () => onInsertMarkdown(action())
  }, [onInsertMarkdown])

  const handleMouseEnter = useCallback((e: React.MouseEvent, title: string) => {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    setTooltip({
      text: title,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#fafafa',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={toggleSidebar}
          title="Toggle File Explorer"
          aria-label="Toggle File Explorer"
          style={baseButtonStyle}
          onMouseEnter={(e) => handleMouseEnter(e, 'Toggle File Explorer')}
          onMouseLeave={handleMouseLeave}
        >
          {showSidebar ? 'Hide Files' : 'Show Files'}
        </button>
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={btn.label === 'Link' ? handleShowLinkDialog : handleButtonClick(btn.action)}
            title={btn.title}
            aria-label={btn.title}
            style={{
              ...baseButtonStyle,
              fontWeight: btn.label.startsWith('H') ? 600 : 400,
            }}
            onMouseEnter={(e) => handleMouseEnter(e, btn.title)}
            onMouseLeave={handleMouseLeave}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => setShowTableDialog(true)}
          title="Insert table"
          aria-label="Insert table"
          style={baseButtonStyle}
          onMouseEnter={(e) => handleMouseEnter(e, 'Insert table')}
          onMouseLeave={handleMouseLeave}
        >
          Table
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={togglePreview}
          aria-label={showPreview ? 'Hide preview' : 'Show preview'}
          style={baseButtonStyle}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button
          onClick={toggleEditor}
          aria-label={showEditor ? 'Hide editor' : 'Show editor'}
          style={baseButtonStyle}
        >
          {showEditor ? 'Hide Editor' : 'Show Editor'}
        </button>
      </div>
      {tooltip && (
        <div
          style={{
            ...baseTooltipStyle,
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, 0)',
          }}
        >
          {tooltip.text}
        </div>
      )}
      <TableDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={onInsertMarkdown}
      />
      {showLinkDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '300px',
          }}>
            <input
              ref={linkInputRef}
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter link text..."
              aria-label="Link text"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelLink}
                aria-label="Cancel link insertion"
                style={baseButtonStyle}
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                aria-label="Insert link"
                style={primaryButtonStyle}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
