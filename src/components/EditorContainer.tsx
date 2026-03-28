import React, { useEffect, useRef } from 'react'
import { useDocumentStore, useEditorStore, useUIStore } from '../store'
import CodeMirrorEditor from './CodeMirrorEditor'
import { markdownTransformer } from '../utils/markdownTransformer'
import mermaid from 'mermaid'
import { EditorView } from '@codemirror/view'
import '../styles/editor-container.css'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function EditorContainer() {
  const { setActiveTabContent, saveActiveTabToStack, getActiveTab } = useDocumentStore()
  const { setSelection, setCurrentBlockType } = useEditorStore()
  const { showPreview, togglePreview, showEditor, toggleEditor, sliderPosition, setSliderPosition, isFocusMode, toggleFocusMode, isFullscreen, setFullscreen, theme, toggleTheme } = useUIStore()
  const [isDragging, setIsDragging] = React.useState(false)
  const [previewScale, setPreviewScale] = React.useState(1)
  const editorViewRef = useRef<EditorView | null>(null)
  // Touch gesture state
  const lastTouchDistanceRef = useRef<number | null>(null)

  const activeTab = getActiveTab()
  const content = activeTab?.content || ''

  const handleChange = (newContent: string) => {
    setActiveTabContent(newContent)
    saveActiveTabToStack()
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

  // Zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setPreviewScale(prev => Math.min(3, Math.max(0.25, prev + delta)))
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      lastTouchDistanceRef.current = Math.sqrt(dx * dx + dy * dy)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      e.preventDefault()
      const dx = e.touches[1].clientX - e.touches[0].clientX
      const dy = e.touches[1].clientY - e.touches[0].clientY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const delta = (distance - lastTouchDistanceRef.current) * 0.005
      setPreviewScale(prev => Math.min(3, Math.max(0.25, prev + delta)))
      lastTouchDistanceRef.current = distance
    }
  }

  const handleTouchEnd = () => {
    lastTouchDistanceRef.current = null
  }

  const handleZoomIn = () => setPreviewScale(prev => Math.min(3, prev + 0.25))
  const handleZoomOut = () => setPreviewScale(prev => Math.max(0.25, prev - 0.25))
  const handleZoomReset = () => setPreviewScale(1)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus mode: Ctrl+Shift+F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleFocusMode()
      }
      // Fullscreen: F11
      if (e.key === 'F11') {
        e.preventDefault()
        handleFullscreenToggle()
      }
      // Escape: exit focus mode
      if (e.key === 'Escape' && isFocusMode) {
        toggleFocusMode()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFocusMode, toggleFocusMode])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [setFullscreen])

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="editor-container">
      {/* Toolbar */}
      <div className={`editor-toolbar ${isFocusMode ? 'hidden' : ''}`}>
        <div className="toolbar-group">
          <button className="toolbar-button" onClick={togglePreview}>
            <span className="toolbar-button-icon">📖</span>
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <button className="toolbar-button" onClick={toggleEditor}>
            <span className="toolbar-button-icon">✏️</span>
            {showEditor ? '隐藏编辑器' : '显示编辑器'}
          </button>
          <button className="toolbar-button" onClick={toggleFocusMode}>
            <span className="toolbar-button-icon">🎯</span>
            {isFocusMode ? '退出专注' : '专注模式'}
          </button>
          <button className="toolbar-button" onClick={handleFullscreenToggle}>
            <span className="toolbar-button-icon">⛶</span>
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
          <button className="toolbar-button" onClick={toggleTheme}>
            <span className="toolbar-button-icon">🎨</span>
            {theme === 'default' ? '白色主题' : '默认主题'}
          </button>
          <div className="toolbar-divider" />
          <button className="toolbar-button" onClick={handleZoomOut} title="缩小">
            <span className="toolbar-button-icon">➖</span>
          </button>
          <span className="zoom-level">{Math.round(previewScale * 100)}%</span>
          <button className="toolbar-button" onClick={handleZoomIn} title="放大">
            <span className="toolbar-button-icon">➕</span>
          </button>
          <button className="toolbar-button" onClick={handleZoomReset} title="重置缩放">
            <span className="toolbar-button-icon">🔄</span>
          </button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className={`editor-layout ${!showPreview ? 'single-editor' : ''} ${!showEditor ? 'single-preview' : ''}`}>
        {/* Preview Panel */}
        <div
          className={`preview-panel ${!showPreview ? 'hidden' : ''}`}
          style={{ width: !showPreview ? '0%' : (!showEditor ? '100%' : `${sliderPosition}%`) }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="markdown-preview"
            style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {/* Resize Handle */}
        {showPreview && showEditor && (
          <div
            className={`resize-handle ${isDragging ? 'dragging' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div className="resize-handle-line" />
          </div>
        )}

        {/* Editor Panel */}
        <div
          className={`editor-panel ${!showEditor ? 'hidden' : ''}`}
          style={{ width: !showPreview ? '100%' : (!showEditor ? '0%' : `${100 - sliderPosition}%`) }}
        >
          <CodeMirrorEditor
            viewRef={editorViewRef}
            content={content}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </div>

      {/* Fullscreen Exit Button */}
      {isFullscreen && !isFocusMode && (
        <button
          className="fullscreen-exit-btn"
          onClick={handleFullscreenToggle}
          title="退出全屏 (F11)"
        >
          ⛶
        </button>
      )}
    </div>
  )
}
