import React from 'react'
import mermaid from 'mermaid'
import { useDocumentStore, useUIStore } from '../store'
import { markdownTransformer } from '../utils/markdownTransformer'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function InsightPanel() {
  const { getActiveTab } = useDocumentStore()
  const { showPreview, isPreviewMaximized, togglePreviewMaximized } = useUIStore()
  const activeTab = getActiveTab()
  const [previewScale, setPreviewScale] = React.useState(1)
  const content = activeTab?.content ?? ''
  const previewHtml = markdownTransformer.transform(content)
  const mermaidCode = markdownTransformer.extractMermaidCode(content)

  React.useEffect(() => {
    const renderMermaid = async () => {
      if (!showPreview || mermaidCode.length === 0) return
      await new Promise(resolve => setTimeout(resolve, 100))

      const previewContainer = document.querySelector('.insight-preview .markdown-preview')
      if (!previewContainer) return

      const mermaidDivs = previewContainer.querySelectorAll('.mermaid-diagram')
      for (let i = 0; i < mermaidDivs.length; i++) {
        const div = mermaidDivs[i] as HTMLElement
        const code = mermaidCode[i]
        if (!code) continue

        try {
          const { svg, bindFunctions } = await mermaid.render(`insight-mermaid-${activeTab?.id ?? 'doc'}-${i}`, code)
          div.innerHTML = svg
          bindFunctions?.(div)
        } catch (error) {
          div.innerHTML = `<pre style="color: red; padding: 10px; border: 1px solid red;">Mermaid error: ${error instanceof Error ? error.message : 'Unknown error'}</pre>`
        }
      }
    }

    renderMermaid()
  }, [activeTab?.id, mermaidCode, showPreview])

  return (
    <aside className={`insight-panel ${isPreviewMaximized ? 'maximized' : ''}`}>
      <div className="insight-body">
        {showPreview && (
          <div className="insight-preview">
            <div className="preview-tools">
              <button onClick={() => setPreviewScale(scale => Math.max(0.5, scale - 0.1))}>−</button>
              <span>{Math.round(previewScale * 100)}%</span>
              <button onClick={() => setPreviewScale(scale => Math.min(2, scale + 0.1))}>+</button>
              <button
                className="preview-fullscreen-button"
                onClick={togglePreviewMaximized}
                title={isPreviewMaximized ? 'Exit fullscreen' : 'Fullscreen'}
                aria-label={isPreviewMaximized ? 'Exit fullscreen' : 'Fullscreen'}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {isPreviewMaximized ? (
                    <>
                      <path d="M9 3v6H3" />
                      <path d="M15 3v6h6" />
                      <path d="M9 21v-6H3" />
                      <path d="M15 21v-6h6" />
                    </>
                  ) : (
                    <>
                      <path d="M8 3H3v5" />
                      <path d="M16 3h5v5" />
                      <path d="M8 21H3v-5" />
                      <path d="M16 21h5v-5" />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <div
              className="markdown-preview"
              style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}

      </div>
    </aside>
  )
}
