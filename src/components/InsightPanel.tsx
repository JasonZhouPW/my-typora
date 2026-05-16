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
              <button className="preview-fullscreen-button" onClick={togglePreviewMaximized}>
                {isPreviewMaximized ? 'Exit Fullscreen' : 'Fullscreen'}
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
