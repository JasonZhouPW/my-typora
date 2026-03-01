import { useState, useEffect } from 'react'
import { useDocumentStore, useUIStore } from '../store'
import { fileOperations } from '../utils/fileOperations'
import ContextMenu from './ContextMenu'
import '../styles/file-explorer.css'

interface FileItem {
  name: string
  path: string
  type: 'folder' | 'file'
  isDirectory: boolean
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  item: FileItem | null
  isOnItem: boolean
}

export default function FileExplorer() {
  const { setFilePath, setInitialContent, setModified } = useDocumentStore()
  const { toggleSidebar } = useUIStore()
  const [currentPath, setCurrentPath] = useState<string>('')
  const [items, setItems] = useState<FileItem[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    isOnItem: false,
  })

  // Load home directory on mount
  useEffect(() => {
    loadDirectory('')
  }, [])

  const loadDirectory = async (dirPath: string) => {
    try {
      const result = await fileOperations.readDir(dirPath || undefined)
      setCurrentPath(dirPath === '' ? 'Home' : dirPath)
      setItems(result)
    } catch (error) {
      console.error('Failed to load directory:', error)
      setItems([])
    }
  }

  const handleFolderClick = (item: FileItem) => {
    // Navigate into folder
    setHistory(prev => [...prev, currentPath])
    loadDirectory(item.path)
  }

  const handleFileClick = async (item: FileItem) => {
    if (item.type === 'file' && (item.name.endsWith('.md') || item.name.endsWith('.markdown') || item.name.endsWith('.txt'))) {
      try {
        const content = await fileOperations.readFile(item.path)
        if (content) {
          setFilePath(content.path)
          setInitialContent(content.content)
          setModified(false)
        }
      } catch (error) {
        console.error('Failed to open file:', error)
      }
    }
  }

  const handleGoUp = () => {
    if (history.length > 0) {
      const parentPath = history[history.length - 1]
      setHistory(prev => prev.slice(0, -1))
      loadDirectory(parentPath)
    }
  }

  const isMarkdownFile = (name: string) => {
    return name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')
  }

  const isHome = currentPath === '' || currentPath === 'Home'

  // Handle context menu (right-click)
  const handleContextMenu = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
      isOnItem: !!item,
    })
  }

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  // Create new file
  const handleCreateFile = async () => {
    const dirPath = isHome ? '' : currentPath
    const fileName = prompt('请输入文件名:', 'untitled.md')
    if (!fileName) return

    try {
      const result = await fileOperations.createFile(dirPath, fileName)
      if (result) {
        // Refresh the file list
        loadDirectory(isHome ? '' : currentPath)
      }
    } catch (error) {
      console.error('Failed to create file:', error)
      alert('创建文件失败')
    }
  }

  // Delete file or folder
  const handleDelete = async () => {
    if (!contextMenu.item) return

    const confirmMsg = contextMenu.item.isDirectory
      ? `确定要删除文件夹 "${contextMenu.item.name}" 吗？`
      : `确定要删除文件 "${contextMenu.item.name}" 吗？`

    if (!confirm(confirmMsg)) return

    try {
      const success = await fileOperations.deleteFile(contextMenu.item.path, contextMenu.item.isDirectory)
      if (success) {
        // Refresh the file list
        loadDirectory(isHome ? '' : currentPath)
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('删除失败')
    }
  }

  // Build context menu items
  const contextMenuItems = [
    {
      label: '新建文件',
      onClick: handleCreateFile,
      icon: '📄',
    },
    ...(contextMenu.isOnItem && contextMenu.item
      ? [
          {
            label: '删除',
            onClick: handleDelete,
            icon: '🗑️',
            danger: true,
          },
        ]
      : []),
  ]

  return (
    <div className="file-explorer">
      {/* Header */}
      <div className="file-explorer-header">
        <h3 className="file-explorer-title">
          <span>📂</span> 文件
        </h3>
        <button
          className="file-explorer-close"
          onClick={toggleSidebar}
          title="关闭侧边栏"
        >
          ×
        </button>
      </div>

      {/* Back button when not at home */}
      {!isHome && (
        <div
          className="file-explorer-back"
          onClick={handleGoUp}
        >
          <span className="file-explorer-back-icon">↩️</span>
          <span>返回上级目录</span>
        </div>
      )}

      {/* File List */}
      <div
        className="file-explorer-list"
        onContextMenu={(e) => handleContextMenu(e, null)}
      >
        {items.length === 0 ? (
          <div className="file-explorer-empty">
            {isHome ? '加载中...' : '空文件夹'}
          </div>
        ) : (
          <div>
            {/* Folders first */}
            {items.filter(item => item.isDirectory).map((item) => (
              <div
                key={item.path}
                className="file-item"
                onClick={() => handleFolderClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                title={item.path}
              >
                <span className="file-item-icon file-item-icon-folder">📁</span>
                <span className="file-item-name">{item.name}</span>
              </div>
            ))}

            {/* Then files */}
            {items.filter(item => !item.isDirectory).map((item) => (
              <div
                key={item.path}
                className={`file-item ${!isMarkdownFile(item.name) ? 'file-item-disabled' : ''}`}
                onClick={() => isMarkdownFile(item.name) && handleFileClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                title={isMarkdownFile(item.name) ? item.path : '仅支持打开 Markdown 文件'}
              >
                <span className="file-item-icon file-item-icon-file">📄</span>
                <span className={`file-item-name ${!isMarkdownFile(item.name) ? 'disabled' : ''}`}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with current path */}
      <div className="file-explorer-footer">
        {currentPath || 'Home'}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}
    </div>
  )
}
