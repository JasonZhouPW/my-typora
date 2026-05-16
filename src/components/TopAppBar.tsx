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
    showPreview,
    showInsightPanel,
  } = useUIStore()
  const activeTab = getActiveTab()
  const title = getDocumentTitle(activeTab?.filePath ?? null, activeTab?.content ?? '')
  const saveState = activeTab?.isModified ? 'Modified' : 'Saved'

  return (
    <header className="workspace-topbar">
      <div className="topbar-brand">
        <button className="text-control sidebar-toggle" onClick={toggleSidebar} title="Toggle sidebar">
          {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
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
        <button className={`text-control preview-toggle ${showPreview ? 'active' : ''}`} onClick={togglePreview} title="Toggle preview">
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
        <button className="text-control theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'default' ? 'Dark' : 'Light'}
        </button>
        <button className="icon-control" onClick={toggleCommandPalette} title="Command palette">⌘</button>
        <button className="text-control insight-toggle" onClick={toggleInsightPanel} title="Toggle insight panel">
          {showInsightPanel ? 'Hide Info' : 'Show Info'}
        </button>
      </div>
    </header>
  )
}
