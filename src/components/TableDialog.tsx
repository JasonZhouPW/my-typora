import { useState } from 'react'

interface TableDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (markdown: string) => void
}

export default function TableDialog({ isOpen, onClose, onInsert }: TableDialogProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)

  if (!isOpen) return null

  const handleInsert = () => {
    const headerRow = '| ' + Array(cols).fill('').join(' | ') + ' |'
    const separatorRow = '| ' + Array(cols).fill('---').join(' | ') + ' |'
    const dataRows = Array(rows - 1).fill(0).map(() =>
      '| ' + Array(cols).fill('').join(' | ') + ' |'
    )

    const markdown = [headerRow, separatorRow, ...dataRows].join('\n') + '\n'
    onInsert(markdown)
    onClose()
  }

  return (
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
        padding: '24px',
        borderRadius: '8px',
        minWidth: '300px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Insert Table</h3>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rows:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={rows}
            onChange={(e) => setRows(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Columns:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={cols}
            onChange={(e) => setCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
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
            onClick={handleInsert}
            style={{
              padding: '8px 16px',
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
  )
}
