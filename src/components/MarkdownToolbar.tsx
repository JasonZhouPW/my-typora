import { useState, useEffect, useRef } from 'react'
import { useUIStore } from '../store'
import TableDialog from './TableDialog'

interface MarkdownToolbarProps {
  onInsertMarkdown: (text: { before: string; after: string } | string) => void
}

const BUTTONS = [
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

export default function MarkdownToolbar({ onInsertMarkdown }: MarkdownToolbarProps) {
  const { showPreview, togglePreview, showEditor, toggleEditor } = useUIStore()
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkText, setLinkText] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showLinkDialog && linkInputRef.current) {
      linkInputRef.current.focus()
    }
  }, [showLinkDialog])

  const handleInsertLink = () => {
    if (linkText) {
      onInsertMarkdown(`[${linkText}](${linkText})`)
    }
    setShowLinkDialog(false)
    setLinkText('')
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafafa',
        flexWrap: 'wrap',
      }}>
        {BUTTONS.map((btn, i) => (
          <button
            key={i}
            onClick={() => onInsertMarkdown(btn.action())}
            title={btn.title}
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              minWidth: '32px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontWeight: btn.label.startsWith('H') ? 600 : 400,
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={() => setShowTableDialog(true)}
          title="Table"
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            minWidth: '32px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          Table
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={togglePreview}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button
          onClick={toggleEditor}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {showEditor ? 'Hide Editor' : 'Show Editor'}
        </button>
      </div>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInsertLink()
                if (e.key === 'Escape') {
                  setShowLinkDialog(false)
                  setLinkText('')
                }
              }}
              placeholder="Enter link text..."
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
                onClick={() => {
                  setShowLinkDialog(false)
                  setLinkText('')
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  cursor: 'pointer',
                }}
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
