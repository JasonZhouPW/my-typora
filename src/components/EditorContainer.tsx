import React from 'react'
import { useDocumentStore, useEditorStore, useUIStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import { markdownTransformer } from '../utils/markdownTransformer'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function EditorContainer() {
  const { content, setContent, saveToStack } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showPreview, togglePreview, showEditor, toggleEditor, sliderPosition, setSliderPosition } = useUIStore()
  const [isDragging, setIsDragging] = React.useState(false)

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
  const mermaidCode = markdownTransformer.extractMermaidCode(content)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const container = document.querySelector('.editor-layout') as HTMLElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100

      if (percentage > 20 && percentage < 80) {
        setSliderPosition(percentage)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, setSliderPosition])

  React.useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidCode.length === 0) return

      // Wait for React to finish rendering
      await new Promise(resolve => setTimeout(resolve, 100))

      const previewContainer = document.querySelector('.markdown-preview')
      if (!previewContainer) return

      const mermaidDivs = previewContainer.querySelectorAll('.mermaid-diagram')

      for (let i = 0; i < mermaidDivs.length; i++) {
        const div = mermaidDivs[i] as HTMLElement
        if (i < mermaidCode.length && mermaidCode[i]) {
          const code = mermaidCode[i]

          try {
            const { svg, bindFunctions } = await mermaid.render(`mermaid-diagram-${i}`, code)
            div.innerHTML = svg
            bindFunctions?.(div)
          } catch (error) {
            console.error('Mermaid rendering error:', error)
            div.innerHTML = `<pre style="color: red; padding: 10px; border: 1px solid red;">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCode:\n${code}</pre>`
          }
        }
      }
    }

    renderMermaid()
  }, [mermaidCode])

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', padding: '0 20px' }}>
        <button onClick={togglePreview} style={{ marginRight: '10px' }}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button onClick={toggleEditor}>
          {showEditor ? 'Hide Editor' : 'Show Editor'}
        </button>
      </div>
      <div className="editor-layout" style={{ display: 'flex', flex: 1, height: '100%' }}>
        <div style={{ width: !showPreview ? '0%' : (!showEditor ? '100%' : `${sliderPosition}%`), overflow: 'hidden' }}>
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
        {showPreview && showEditor && (
          <div
            style={{
              width: '8px',
              cursor: 'col-resize',
              backgroundColor: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: isDragging ? 'none' : 'background-color 0.2s',
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bdbdbd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          >
            <div style={{ width: '2px', height: '20px', backgroundColor: '#9e9e9e' }} />
          </div>
        )}
        <div style={{ width: !showPreview ? '100%' : (!showEditor ? '0%' : `${100 - sliderPosition}%`), overflow: 'hidden' }}>
          {showEditor && (
            <CodeMirrorEditor
              content={content}
              onChange={handleChange}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
