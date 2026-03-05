import { useState, useEffect } from 'react'
import { useDocumentStore, useUIStore } from '../store'
import { fileOperations } from '../utils/fileOperations'
import { naturalCompare } from '../utils/naturalSort'
import ContextMenu from './ContextMenu'
import '../styles/file-explorer.css'

interface FileItem {
  name: string
  path: string
  type: 'folder' | 'file'
  isDirectory: boolean
  mtime?: number
  birthtime?: number
}

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  item: FileItem | null
  isOnItem: boolean
}

type SortBy = 'name' | 'mtime' | 'birthtime'
type SortOrder = 'asc' | 'desc'

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
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Load home directory on mount
  useEffect(() => {
    loadDirectory('')
  }, [])

  // Re-sort and update items when sort criteria changes
  useEffect(() => {
    if (items.length > 0) {
      const sorted = sortItems(items)
      // Only update if order actually changed (prevent infinite loop)
      const isAlreadySorted = items.every((item, idx) => sorted[idx]?.path === item.path)
      if (!isAlreadySorted) {
        setItems(sorted)
      }
    }
  }, [sortBy, sortOrder])

  const loadDirectory = async (dirPath: string) => {
    try {
      const result = await fileOperations.getStatsWithTimes(dirPath || undefined)
      setCurrentPath(dirPath === '' ? 'Home' : dirPath)
      const sorted = sortItems(result)
      setItems(sorted)
    } catch (error) {
      console.error('Failed to load directory:', error)
      setItems([])
    }
  }

  const sortItems = (itemsToSort: FileItem[]): FileItem[] => {
    return [...itemsToSort].sort((a, b) => {
      // Folders always first
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1

      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = naturalCompare(a.name, b.name)
          break
        case 'mtime':
          comparison = (a.mtime || 0) - (b.mtime || 0)
          break
        case 'birthtime':
          comparison = (a.birthtime || 0) - (b.birthtime || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  const handleSortChange = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      // Toggle order if same sort criterion
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Change sort criterion, reset to asc
      setSortBy(newSortBy)
      setSortOrder('asc')
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
      const result = await fileOperations.deleteFile(contextMenu.item.path, contextMenu.item.isDirectory)
      if (result.success) {
        // Refresh the file list
        loadDirectory(isHome ? '' : currentPath)
      } else {
        // Show specific error message
        let errorMsg = '删除失败'
        if (result.error) {
          if (result.error.includes('ENOENT')) {
            errorMsg = '文件不存在'
          } else if (result.error.includes('EACCES')) {
            errorMsg = '权限不足，无法删除'
          } else if (result.error.includes('EPERM')) {
            errorMsg = '文件正在使用中，无法删除'
          } else {
            errorMsg = `删除失败：${result.error}`
          }
        }
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // Rename file or folder
  const handleRename = async () => {
    if (!contextMenu.item) return

    const newName = prompt(
      '请输入新文件名:',
      contextMenu.item.name
    )
    if (!newName || newName === contextMenu.item.name) return

    try {
      const result = await fileOperations.renameFile(contextMenu.item.path, newName)
      if (result.success) {
        // Refresh the file list
        loadDirectory(isHome ? '' : currentPath)
      } else {
        // Show specific error message
        let errorMsg = '重命名失败'
        if (result.error) {
          if (result.error.includes('ENOENT')) {
            errorMsg = '文件不存在'
          } else if (result.error.includes('EEXIST')) {
            errorMsg = '文件名已存在'
          } else if (result.error.includes('EACCES')) {
            errorMsg = '权限不足，无法重命名'
          } else if (result.error.includes('EPERM')) {
            errorMsg = '文件正在使用中，无法重命名'
          } else {
            errorMsg = `重命名失败：${result.error}`
          }
        }
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Failed to rename:', error)
      alert('重命名失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // Build context menu items
  const contextMenuItems = [
    {
      label: '新建文件',
      onClick: handleCreateFile,
      icon: '📄',
    },
    // Sort submenu
    {
      label: '排序方式',
      icon: '🔀',
      onClick: () => {},
      disabled: true,
    },
    {
      label: `  ${sortBy === 'name' ? '•' : '  '} 文件名`,
      onClick: () => handleSortChange('name'),
      icon: sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : '  ',
    },
    {
      label: `  ${sortBy === 'mtime' ? '•' : '  '} 修改时间`,
      onClick: () => handleSortChange('mtime'),
      icon: sortBy === 'mtime' ? (sortOrder === 'asc' ? '↑' : '↓') : '  ',
    },
    {
      label: `  ${sortBy === 'birthtime' ? '•' : '  '} 创建时间`,
      onClick: () => handleSortChange('birthtime'),
      icon: sortBy === 'birthtime' ? (sortOrder === 'asc' ? '↑' : '↓') : '  ',
    },
    // Divider
    { label: '', onClick: () => {}, disabled: true, isDivider: true } as any,
    ...(contextMenu.isOnItem && contextMenu.item
      ? [
          {
            label: '重命名',
            onClick: handleRename,
            icon: '✏️',
          },
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
        <div className="file-explorer-header-left">
          <h3 className="file-explorer-title">
            <span>📂</span> 文件
          </h3>
          <div className="file-explorer-sort">
            <button
              className={`file-explorer-sort-button ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => handleSortChange('name')}
              title="按文件名排序"
            >
              {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : 'A-Z'}
            </button>
            <button
              className={`file-explorer-sort-button ${sortBy === 'mtime' ? 'active' : ''}`}
              onClick={() => handleSortChange('mtime')}
              title="按修改时间排序"
            >
              {sortBy === 'mtime' ? (sortOrder === 'asc' ? '↑' : '↓') : '时间'}
            </button>
          </div>
        </div>
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
