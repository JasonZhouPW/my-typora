import { useDocumentStore } from '../store'
import { fileOperations } from '../utils/fileOperations'

interface RecentFilesProps {
  onFileOpened?: () => void
}

export default function RecentFiles({ onFileOpened }: RecentFilesProps) {
  const { recentFiles, clearRecentFiles, addTab, tabs, switchTab } = useDocumentStore()

  const handleOpenRecentFile = async (filePath: string) => {
    try {
      // Check if file is already open
      const existingTab = tabs.find(t => t.filePath === filePath)
      if (existingTab) {
        switchTab(existingTab.id)
      } else {
        const result = await fileOperations.readFile(filePath)
        if (result) {
          addTab({ content: result.content, filePath: result.path })
        }
      }
      onFileOpened?.()
    } catch (error) {
      console.error('Failed to open recent file:', error)
    }
  }

  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath
  }

  const getFileDir = (filePath: string) => {
    const parts = filePath.split('/')
    parts.pop()
    return parts.join('/')
  }

  if (recentFiles.length === 0) {
    return null
  }

  return (
    <div className="recent-files">
      <div className="recent-files-header">
        <span className="recent-files-title">最近文件</span>
        <button
          className="recent-files-clear"
          onClick={clearRecentFiles}
          title="清除历史"
        >
          🗑️
        </button>
      </div>
      <div className="recent-files-list">
        {recentFiles.map((filePath, index) => (
          <div
            key={`${filePath}-${index}`}
            className="recent-file-item"
            onClick={() => handleOpenRecentFile(filePath)}
            title={filePath}
          >
            <span className="recent-file-icon">📄</span>
            <div className="recent-file-info">
              <span className="recent-file-name">{getFileName(filePath)}</span>
              <span className="recent-file-dir">{getFileDir(filePath)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
