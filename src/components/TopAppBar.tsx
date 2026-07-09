import { useDocumentStore, useUIStore } from '../store'
import { getDocumentTitle } from '../utils/documentInsights'

function Icon({ name }: { name: 'new' | 'open' | 'save' | 'preview' | 'editor' | 'theme' }) {
  if (name === 'new') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    )
  }
  if (name === 'open') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h6l2 3h10v9H3z" />
        <path d="M3 7v12" />
      </svg>
    )
  }
  if (name === 'save') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h12l2 2v14H5z" />
        <path d="M8 4v6h8V4" />
        <path d="M8 17h8" />
      </svg>
    )
  }
  if (name === 'preview') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 5h18v14H3z" />
        <path d="M12 5v14" />
      </svg>
    )
  }
  if (name === 'editor') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
        <path d="M8 17h4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a8 8 0 1 0 0 16z" />
      <path d="M12 4a8 8 0 0 1 0 16" />
    </svg>
  )
}

interface TopAppBarProps {
  onNewFile: () => void
  onOpenFile: () => void
  onSaveFile: () => void
}

export default function TopAppBar({ onNewFile, onOpenFile, onSaveFile }: TopAppBarProps) {
  const { getActiveTab } = useDocumentStore()
  const {
    toggleCommandPalette,
    toggleGlobalSearch,
    toggleEditor,
    togglePreview,
    toggleTheme,
    theme,
    showEditor,
    showPreview,
  } = useUIStore()
  const activeTab = getActiveTab()
  const title = getDocumentTitle(activeTab?.filePath ?? null, activeTab?.content ?? '')
  const saveState = activeTab?.isModified ? 'Modified' : 'Saved'

  return (
    <header className="workspace-topbar">
      <div className="topbar-brand">
        <div>
          <div className="topbar-title">Typra</div>
          <div className="topbar-subtitle">{title}</div>
        </div>
      </div>

      <button className="topbar-search" onClick={toggleGlobalSearch}>
        <span>Search documents</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="topbar-actions">
        <span className={`save-state ${activeTab?.isModified ? 'dirty' : ''}`}>{saveState}</span>
        <button className="icon-control" onClick={onNewFile} title="New document" aria-label="New document">
          <Icon name="new" />
        </button>
        <button className="icon-control" onClick={onOpenFile} title="Open file" aria-label="Open file">
          <Icon name="open" />
        </button>
        <button className="icon-control primary" onClick={onSaveFile} title="Save file" aria-label="Save file">
          <Icon name="save" />
        </button>
        <button className={`icon-control ${showPreview ? 'active' : ''}`} onClick={togglePreview} title={showPreview ? 'Hide preview' : 'Show preview'} aria-label={showPreview ? 'Hide preview' : 'Show preview'}>
          <Icon name="preview" />
        </button>
        <button className={`icon-control ${showEditor ? 'active' : ''}`} onClick={toggleEditor} title={showEditor ? 'Hide editor' : 'Show editor'} aria-label={showEditor ? 'Hide editor' : 'Show editor'}>
          <Icon name="editor" />
        </button>
        <button className="icon-control" onClick={toggleTheme} title={theme === 'default' ? 'Switch to dark theme' : 'Switch to light theme'} aria-label="Toggle theme">
          <Icon name="theme" />
        </button>
        <button className="icon-control" onClick={toggleCommandPalette} title="Command palette">⌘</button>
      </div>
    </header>
  )
}
