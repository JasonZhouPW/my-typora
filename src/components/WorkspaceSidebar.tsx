import FileExplorer from './FileExplorer'
import RecentFiles from './RecentFiles'
import { useDocumentStore, useUIStore } from '../store'
import { extractTags } from '../utils/documentInsights'

export default function WorkspaceSidebar() {
  const { tabs, recentFiles } = useDocumentStore()
  const { activeSidebarSection, setActiveSidebarSection } = useUIStore()
  const tags = Array.from(new Set(tabs.flatMap(tab => extractTags(tab.content)))).sort()

  return (
    <aside className="workspace-sidebar">
      <div className="sidebar-header">
        <div>
          <div className="sidebar-title">Workspace</div>
          <div className="sidebar-caption">{tabs.length} open documents</div>
        </div>
      </div>

      <nav className="sidebar-tabs" aria-label="Workspace sections">
        {[
          ['files', 'Files'],
          ['tags', 'Tags'],
          ['search', 'Saved'],
          ['recent', 'Recent'],
        ].map(([section, label]) => (
          <button
            key={section}
            className={`sidebar-tab ${activeSidebarSection === section ? 'active' : ''}`}
            onClick={() => setActiveSidebarSection(section as typeof activeSidebarSection)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-section-body">
        {activeSidebarSection === 'files' && <FileExplorer />}
        {activeSidebarSection === 'recent' && <RecentFiles />}
        {activeSidebarSection === 'tags' && (
          <div className="tag-list">
            {tags.length === 0 ? (
              <div className="empty-state">No tags in open documents</div>
            ) : tags.map(tag => (
              <button className="tag-row" key={tag}>
                <span>#{tag}</span>
                <small>{tabs.filter(tab => extractTags(tab.content).includes(tag)).length}</small>
              </button>
            ))}
          </div>
        )}
        {activeSidebarSection === 'search' && (
          <div className="saved-searches">
            <button className="saved-search-row">Modified documents</button>
            <button className="saved-search-row">Mermaid diagrams</button>
            <button className="saved-search-row">Code blocks</button>
            <div className="sidebar-caption padded">{recentFiles.length} recent files indexed for quick access</div>
          </div>
        )}
      </div>
    </aside>
  )
}
