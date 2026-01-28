import React, { useRef } from 'react'
import { useDocumentStore, useEditorStore, useUIStore, useFileTreeStore } from '../store'
import CodeMirrorEditor, { type CodeMirrorEditorRef } from './CodeMirrorEditor'
import FileExplorer from './FileExplorer'
import MarkdownToolbar from './MarkdownToolbar'
import { markdownTransformer } from '../utils/markdownTransformer'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function EditorContainer() {
  const { content, setContent, saveToStack, setFilePath, setInitialContent } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showSidebar, sidebarWidth, setSidebarWidth, showPreview, showEditor, sliderPosition, setSliderPosition } = useUIStore()
  const { setSelectedFile } = useFileTreeStore()
  const [isDraggingDivider, setIsDraggingDivider] = React.useState(false)
  const [isDraggingSidebar, setIsDraggingSidebar] = React.useState(false)
  const editorRef = useRef<CodeMirrorEditorRef>(null)

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

  const handleFileSelect = async (path: string) => {
    try {
      const fileContent = await window.electronAPI.fileTree.readFile(path)
      setInitialContent(fileContent)
      setFilePath(path)
      setSelectedFile(path)
    } catch (error) {
      console.error('Error loading file:', error)
    }
  }

  const previewHtml = markdownTransformer.transform(content)
  const mermaidCode = markdownTransformer.extractMermaidCode(content)

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    setIsDraggingDivider(true)
    e.preventDefault()
  }

  const handleSidebarMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSidebar(true)
    e.preventDefault()
  }

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingDivider) {
        const container = document.querySelector('.editor-layout') as HTMLElement
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = (x / rect.width) * 100

        if (percentage > 20 && percentage < 80) {
          setSliderPosition(percentage)
        }
      }

      if (isDraggingSidebar) {
        const sidebar = document.querySelector('.file-explorer') as HTMLElement
        if (!sidebar) return

        const rect = sidebar.getBoundingClientRect()
        const newWidth = e.clientX - rect.left
        if (newWidth >= 150 && newWidth <= 600) {
          setSidebarWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDraggingDivider(false)
      setIsDraggingSidebar(false)
    }

    if (isDraggingDivider || isDraggingSidebar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingDivider, isDraggingSidebar, setSliderPosition, setSidebarWidth])

  React.useEffect(() => {
    const renderMermaid = async () => {
      if (mermaidCode.length === 0) return

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
            div.innerHTML = `<pre style="color: red; padding: 10px; border: 1.5px solid red;">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCode:\n${code}</pre>`
          }
        }
      }
    }

    renderMermaid()
  }, [mermaidCode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        {showSidebar && (
          <>
            <div className="file-explorer" style={{ width: sidebarWidth, borderRight: '1px solid #e0e0e0' }}>
              <FileExplorer onFileSelect={handleFileSelect} />
            </div>
            <div
              style={{
                width: '8px',
                cursor: 'col-resize',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseDown={handleSidebarMouseDown}
            >
              <div style={{ width: '2px', height: '20px', backgroundColor: '#9e9e9e' }} />
            </div>
          </>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <MarkdownToolbar onInsertMarkdown={(text) => editorRef.current?.insertText(text)} />
          <div className="editor-layout" style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
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
                  transition: isDraggingDivider ? 'none' : 'background-color 0.2s',
                }}
                onMouseDown={handleDividerMouseDown}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bdbdbd'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              >
                <div style={{ width: '2px', height: '20px', backgroundColor: '#9e9e9e' }} />
              </div>
            )}
            <div style={{ width: !showPreview ? '100%' : (!showEditor ? '0%' : `${100 - sliderPosition}%`), overflow: 'hidden' }}>
              {showEditor && (
                <CodeMirrorEditor
                  ref={editorRef}
                  content={content}
                  onChange={handleChange}
                  onSelectionChange={handleSelectionChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
