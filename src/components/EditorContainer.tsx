import { useDocumentStore, useEditorStore, useUIStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import { markdownTransformer } from '../utils/markdownTransformer'

export default function EditorContainer() {
  const { content, setContent, saveToStack } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showPreview, togglePreview } = useUIStore()

  const handleChange = (newContent: string) => {
    setContent(newContent)
    saveToStack()
  }

  const handleSelectionChange = (from: number, to: number) => {
    setSelection(from, to)
    const lines = content.split('\n')
    const currentLine = content.substring(0, from).split('\n').length - 1
    const lineText = lines[currentLine] || ''
    setCurrentBlockType(detectBlockType(lineText))
  }

  const detectBlockType = (line: string): string => {
    const trimmed = line.trim()
    if (trimmed.startsWith('# ')) return 'heading1'
    if (trimmed.startsWith('## ')) return 'heading2'
    if (trimmed.startsWith('### ')) return 'heading3'
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) return 'bullet'
    if (trimmed.match(/^\d+\./)) return 'numbered'
    if (trimmed.startsWith('```')) return 'code'
    if (trimmed.startsWith('>')) return 'quote'
    return 'paragraph'
  }

  const previewHtml = markdownTransformer.transform(content)

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', padding: '0 20px' }}>
        <button onClick={togglePreview}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, height: '100%' }}>
        <div style={{ flex: 1, marginRight: showPreview ? '10px' : '0' }}>
          {showPreview && (
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '20px',
                height: '100%',
                overflow: 'auto',
              }}
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <CodeMirrorEditor
            content={content}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>
    </div>
  )
}
