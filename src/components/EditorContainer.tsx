import { useDocumentStore, useEditorStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'

export default function EditorContainer() {
  const { content, setContent, saveToStack } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()

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

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, marginRight: '10px' }}>
        <CodeMirrorEditor
          content={content}
          onChange={handleChange}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  )
}
