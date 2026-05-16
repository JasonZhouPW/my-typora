import { useDocumentStore, useUIStore } from '../store'
import { getDocumentTitle } from '../utils/documentInsights'

interface TopAppBarProps {
  onNewFile: () => void
  onOpenFile: () => void
  onSaveFile: () => void
}

export default function TopAppBar({ onNewFile, onOpenFile, onSaveFile }: TopAppBarProps) {
  const { getActiveTab } = useDocumentStore()
  const {
    toggleSidebar,
    toggleInsightPanel,
    toggleCommandPalette,
    toggleGlobalSearch,
    togglePreview,
    toggleTheme,
    theme,
    showSidebar,
    showInsightPanel,
  } = useUIStore()
  const activeTab = getActiveTab()
  const title = getDocumentTitle(activeTab?.filePath ?? null, activeTab?.content ?? '')
  const saveState = activeTab?.isModified ? 'Modified' : 'Saved'

  return (
    <header className="workspace-topbar">
      <div className="topbar-brand">
        <button className="icon-control" onClick={toggleSidebar} title="Toggle sidebar">
          {showSidebar ? '◧' : '◨'}
        </button>
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
        <button className="text-control" onClick={onNewFile}>New</button>
        <button className="text-control" onClick={onOpenFile}>Open</button>
        <button className="text-control primary" onClick={onSaveFile}>Save</button>
        <button className="icon-control" onClick={togglePreview} title="Toggle preview">◐</button>
        <button className="icon-control" onClick={toggleTheme} title="Toggle theme">
          {theme === 'default' ? '◑' : '●'}
        </button>
        <button className="icon-control" onClick={toggleCommandPalette} title="Command palette">⌘</button>
        <button className="icon-control" onClick={toggleInsightPanel} title="Toggle insight panel">
          {showInsightPanel ? '◫' : '◩'}
        </button>
      </div>
    </header>
  )
}
