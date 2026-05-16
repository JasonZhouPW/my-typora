import React from 'react'
import mermaid from 'mermaid'
import { useDocumentStore, useUIStore } from '../store'
import { extractHeadings, findBacklinks, getDocumentTitle, type DocumentSummary } from '../utils/documentInsights'
import { markdownTransformer } from '../utils/markdownTransformer'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
})

export default function InsightPanel() {
  const { tabs, getActiveTab } = useDocumentStore()
  const { activeInsightTab, setActiveInsightTab, isPreviewMaximized, togglePreviewMaximized } = useUIStore()
  const activeTab = getActiveTab()
  const [previewScale, setPreviewScale] = React.useState(1)
  const content = activeTab?.content ?? ''
  const previewHtml = markdownTransformer.transform(content)
  const mermaidCode = markdownTransformer.extractMermaidCode(content)
  const documents: DocumentSummary[] = tabs.map(tab => ({
    id: tab.id,
    title: getDocumentTitle(tab.filePath, tab.content),
    filePath: tab.filePath,
    content: tab.content,
  }))
  const activeDocument = activeTab
    ? documents.find(document => document.id === activeTab.id)
    : undefined
  const headings = extractHeadings(content)
  const backlinks = activeDocument ? findBacklinks(activeDocument, documents) : []

  React.useEffect(() => {
    const renderMermaid = async () => {
      if (activeInsightTab !== 'preview' || mermaidCode.length === 0) return
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
  }, [activeInsightTab, activeTab?.id, mermaidCode])

  return (
    <aside className={`insight-panel ${isPreviewMaximized ? 'maximized' : ''}`}>
      <div className="insight-tabs">
        {[
          ['preview', 'Preview'],
          ['outline', 'Outline'],
          ['backlinks', 'Links'],
          ['export', 'Export'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            className={`insight-tab ${activeInsightTab === tab ? 'active' : ''}`}
            onClick={() => setActiveInsightTab(tab as typeof activeInsightTab)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="insight-body">
        {activeInsightTab === 'preview' && (
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

        {activeInsightTab === 'outline' && (
          <div className="outline-list">
            {headings.length === 0 ? (
              <div className="empty-state">No headings in this document</div>
            ) : headings.map(heading => (
              <button className="outline-row" style={{ paddingLeft: `${(heading.level - 1) * 12 + 12}px` }} key={`${heading.line}-${heading.slug}`}>
                <span>{heading.text}</span>
                <small>L{heading.line}</small>
              </button>
            ))}
          </div>
        )}

        {activeInsightTab === 'backlinks' && (
          <div className="backlink-list">
            {backlinks.length === 0 ? (
              <div className="empty-state">No backlinks from open documents</div>
            ) : backlinks.map(link => (
              <div className="backlink-row" key={`${link.document.id}-${link.line}`}>
                <strong>{link.document.title}</strong>
                <span>{link.match}</span>
                <small>Line {link.line}</small>
              </div>
            ))}
          </div>
        )}

        {activeInsightTab === 'export' && (
          <div className="export-panel">
            <button className="export-action" onClick={() => navigator.clipboard?.writeText(content)}>Copy Markdown</button>
            <button className="export-action" onClick={() => navigator.clipboard?.writeText(previewHtml)}>Copy HTML Preview</button>
            <button className="export-action disabled" disabled>Export PDF</button>
            <button className="export-action disabled" disabled>Export DOCX</button>
            <p>PDF and DOCX export need packaging support before they can be enabled.</p>
          </div>
        )}
      </div>
    </aside>
  )
}
