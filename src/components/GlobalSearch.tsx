import React from 'react'
import { useDocumentStore, useUIStore } from '../store'
import { getDocumentTitle, searchDocuments, type DocumentSummary } from '../utils/documentInsights'

export default function GlobalSearch() {
  const { tabs, switchTab } = useDocumentStore()
  const { isGlobalSearchOpen, setGlobalSearchOpen } = useUIStore()
  const [query, setQuery] = React.useState('')
  const documents: DocumentSummary[] = tabs.map(tab => ({
    id: tab.id,
    title: getDocumentTitle(tab.filePath, tab.content),
    filePath: tab.filePath,
    content: tab.content,
  }))
  const results = searchDocuments(query, documents)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setGlobalSearchOpen(true)
      }

      if (event.key === 'Escape') setGlobalSearchOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setGlobalSearchOpen])

  if (!isGlobalSearchOpen) return null

  return (
    <div className="search-overlay" onMouseDown={() => setGlobalSearchOpen(false)}>
      <div className="global-search-panel" onMouseDown={event => event.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search open documents"
        />
        <div className="search-results">
          {results.map(result => (
            <button
              className="search-result"
              key={`${result.document.id}-${result.line}-${result.snippet}`}
              onClick={() => {
                switchTab(result.document.id)
                setGlobalSearchOpen(false)
                setQuery('')
              }}
            >
              <strong>{result.document.title}</strong>
              <span>{result.snippet}</span>
              <small>Line {result.line}</small>
            </button>
          ))}
          {query && results.length === 0 && <div className="empty-state">No results in open documents</div>}
          {!query && <div className="empty-state">Type to search open documents</div>}
        </div>
      </div>
    </div>
  )
}
